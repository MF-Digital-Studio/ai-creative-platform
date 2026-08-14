"use server";

import { revalidatePath } from "next/cache";
import { toFile } from "openai";

import { isSupportedLocale, type AppLocale } from "@/i18n/routing";
import { getAuthenticatedUserId } from "@/lib/auth/require-user";
import { getOpenAIClient } from "@/lib/openai/client";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type RegisterProductAssetResult = {
  status: "error" | "success";
};

export type UpdateCreativeDirectionState = {
  status: "error" | "idle" | "success" | "validation";
};

type CreateQueuedImageGenerationError =
  | "creationFailed"
  | "missingCreativeDirection"
  | "missingProductImage";

export type CreateQueuedImageGenerationResult =
  | { ok: false; message: CreateQueuedImageGenerationError }
  | { ok: true; generationId: string };

type RunQueuedImageGenerationError = "generationFailed" | "notQueued";

export type RunQueuedImageGenerationResult =
  | { ok: false; message: RunQueuedImageGenerationError }
  | { ok: true };

const projectGenerationFields = "id, user_id, creative_direction";
const productAssetGenerationFields =
  "id, user_id, project_id, bucket_id, object_path, created_at";
const queuedGenerationFields = [
  "id",
  "project_id",
  "input_asset_id",
  "generation_type",
  "status",
  "model",
  "creative_direction_snapshot",
].join(", ");
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const generatedAssetsBucket = "generated-assets";
const generationFailureCode = "generationFailed";
const maxGeneratedImageBytes = 20 * 1024 * 1024;

type QueuedImageGenerationRow = {
  id: string;
  project_id: string;
  input_asset_id: string | null;
  generation_type: "image" | "video";
  status: "queued" | "processing" | "succeeded" | "failed";
  model: string;
  creative_direction_snapshot: string;
};

function hasValidObjectPath(userId: string, projectId: string, objectPath: string) {
  const segments = objectPath.split("/");

  return (
    segments.length === 3 &&
    segments[0] === userId &&
    segments[1] === projectId &&
    segments[2].length > 0
  );
}

function getProviderRequestId(response: unknown) {
  if (
    response &&
    typeof response === "object" &&
    "_request_id" in response &&
    typeof response._request_id === "string"
  ) {
    return response._request_id.slice(0, 255);
  }

  return null;
}

async function markGenerationFailed(generationId: string) {
  try {
    const admin = getSupabaseAdminClient();
    await admin
      .from("generations")
      .update({ status: "failed", error_message: generationFailureCode })
      .eq("id", generationId)
      .eq("status", "processing");
  } catch {
    // The primary action result remains safe even if a failure status cannot be persisted.
  }
}

export async function registerProductAsset(
  locale: AppLocale,
  projectId: unknown,
  objectPath: unknown,
): Promise<RegisterProductAssetResult> {
  if (
    !isSupportedLocale(locale) ||
    typeof projectId !== "string" ||
    typeof objectPath !== "string"
  ) {
    return { status: "error" };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId || !hasValidObjectPath(userId, projectId, objectPath)) {
    return { status: "error" };
  }

  try {
    const supabase = await createClient();
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (projectError || !project) {
      return { status: "error" };
    }

    const { error: assetError } = await supabase.from("assets").insert({
      user_id: userId,
      project_id: projectId,
      bucket_id: "product-assets",
      object_path: objectPath,
    });

    if (assetError) {
      return { status: "error" };
    }
  } catch {
    return { status: "error" };
  }

  revalidatePath(`/${locale}/dashboard/projects/${projectId}`, "page");

  return { status: "success" };
}

export async function updateCreativeDirection(
  locale: AppLocale,
  projectId: string,
  _previousState: UpdateCreativeDirectionState,
  formData: FormData,
): Promise<UpdateCreativeDirectionState> {
  if (!isSupportedLocale(locale) || typeof projectId !== "string") {
    return { status: "error" };
  }

  const creativeDirection = formData.get("creative_direction");
  if (typeof creativeDirection !== "string") {
    return { status: "error" };
  }

  const normalizedCreativeDirection = creativeDirection.trim();
  if (Array.from(normalizedCreativeDirection).length > 4000) {
    return { status: "validation" };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { status: "error" };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .update({
        creative_direction: normalizedCreativeDirection || null,
      })
      .eq("id", projectId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      return { status: "error" };
    }
  } catch {
    return { status: "error" };
  }

  revalidatePath(`/${locale}/dashboard/projects/${projectId}`, "page");

  return { status: "success" };
}

export async function createQueuedImageGeneration(
  locale: AppLocale,
  projectId: string,
  _previousState: CreateQueuedImageGenerationResult | null,
): Promise<CreateQueuedImageGenerationResult> {
  void _previousState;

  if (!isSupportedLocale(locale) || typeof projectId !== "string") {
    return { ok: false, message: "creationFailed" };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { ok: false, message: "creationFailed" };
  }

  try {
    const supabase = await createClient();
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(projectGenerationFields)
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (projectError || !project || project.user_id !== userId) {
      return { ok: false, message: "creationFailed" };
    }

    const creativeDirection = project.creative_direction?.trim() ?? "";
    if (!creativeDirection || Array.from(creativeDirection).length > 4000) {
      return { ok: false, message: "missingCreativeDirection" };
    }

    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select(productAssetGenerationFields)
      .eq("project_id", project.id)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      assetError ||
      !asset ||
      asset.user_id !== userId ||
      asset.project_id !== project.id ||
      asset.bucket_id !== "product-assets"
    ) {
      return { ok: false, message: "missingProductImage" };
    }

    const admin = getSupabaseAdminClient();
    const { data: generation, error: generationError } = await admin
      .from("generations")
      .insert({
        project_id: project.id,
        input_asset_id: asset.id,
        generation_type: "image",
        status: "queued",
        provider: "openai",
        model: "gpt-image-2",
        creative_direction_snapshot: creativeDirection,
      })
      .select("id")
      .single();

    if (generationError || !generation) {
      return { ok: false, message: "creationFailed" };
    }

    revalidatePath(`/${locale}/dashboard/projects/${project.id}`, "page");

    return { ok: true, generationId: generation.id };
  } catch {
    return { ok: false, message: "creationFailed" };
  }
}

export async function runQueuedImageGeneration(
  projectId: string,
  generationId: string,
): Promise<RunQueuedImageGenerationResult> {
  if (!uuidPattern.test(projectId) || !uuidPattern.test(generationId)) {
    return { ok: false, message: "generationFailed" };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { ok: false, message: "generationFailed" };
  }

  let processingStarted = false;

  try {
    const supabase = await createClient();
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (projectError || !project || project.user_id !== userId) {
      return { ok: false, message: "generationFailed" };
    }

    const { data: generation, error: generationError } = await supabase
      .from("generations")
      .select(queuedGenerationFields)
      .eq("id", generationId)
      .eq("project_id", project.id)
      .maybeSingle();
    const queuedGeneration = generation as unknown as QueuedImageGenerationRow | null;

    if (
      generationError ||
      !queuedGeneration ||
      queuedGeneration.project_id !== project.id ||
      queuedGeneration.generation_type !== "image" ||
      queuedGeneration.status !== "queued" ||
      !queuedGeneration.input_asset_id
    ) {
      return { ok: false, message: "notQueued" };
    }

    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("id, user_id, project_id, bucket_id, object_path")
      .eq("id", queuedGeneration.input_asset_id)
      .eq("project_id", project.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (
      assetError ||
      !asset ||
      asset.user_id !== userId ||
      asset.project_id !== project.id ||
      asset.bucket_id !== "product-assets" ||
      !hasValidObjectPath(userId, project.id, asset.object_path)
    ) {
      return { ok: false, message: "generationFailed" };
    }

    const outputObjectPath = `${userId}/${project.id}/${queuedGeneration.id}.png`;
    if (!hasValidObjectPath(userId, project.id, outputObjectPath)) {
      return { ok: false, message: "generationFailed" };
    }

    const admin = getSupabaseAdminClient();
    const { data: processingGeneration, error: processingError } = await admin
      .from("generations")
      .update({ status: "processing", error_message: null })
      .eq("id", queuedGeneration.id)
      .eq("project_id", project.id)
      .eq("status", "queued")
      .select("id")
      .maybeSingle();

    if (processingError || !processingGeneration) {
      return { ok: false, message: "notQueued" };
    }
    processingStarted = true;

    const { data: inputImage, error: downloadError } = await admin.storage
      .from(asset.bucket_id)
      .download(asset.object_path);
    if (downloadError || !inputImage) {
      throw new Error("Unable to download the input image.");
    }

    const prompt = queuedGeneration.creative_direction_snapshot.trim();
    if (!prompt) {
      throw new Error("The generation prompt is unavailable.");
    }

    const imageFile = await toFile(inputImage, "product-image", {
      type: inputImage.type || "image/png",
    });
    const imageResponse = await getOpenAIClient().images.edit({
      model: queuedGeneration.model,
      image: imageFile,
      prompt,
      n: 1,
      output_format: "png",
    });
    const imageBase64 = imageResponse.data?.[0]?.b64_json;
    if (typeof imageBase64 !== "string" || imageBase64.length === 0) {
      throw new Error("The image provider returned no image data.");
    }

    const imageBytes = Buffer.from(imageBase64, "base64");
    if (imageBytes.length === 0 || imageBytes.length > maxGeneratedImageBytes) {
      throw new Error("The generated image is invalid.");
    }

    const { error: uploadError } = await admin.storage
      .from(generatedAssetsBucket)
      .upload(outputObjectPath, imageBytes, {
        contentType: "image/png",
        upsert: false,
      });
    if (uploadError) {
      throw new Error("Unable to upload the generated image.");
    }

    const { data: completedGeneration, error: completionError } = await admin
      .from("generations")
      .update({
        status: "succeeded",
        output_bucket_id: generatedAssetsBucket,
        output_object_path: outputObjectPath,
        provider_request_id: getProviderRequestId(imageResponse),
        error_message: null,
      })
      .eq("id", queuedGeneration.id)
      .eq("status", "processing")
      .select("id")
      .maybeSingle();
    if (completionError || !completedGeneration) {
      throw new Error("Unable to save the generated image.");
    }

    return { ok: true };
  } catch {
    if (processingStarted) {
      await markGenerationFailed(generationId);
    }

    return { ok: false, message: "generationFailed" };
  }
}
