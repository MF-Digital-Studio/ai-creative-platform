"use server";

import { revalidatePath } from "next/cache";

import { isSupportedLocale, type AppLocale } from "@/i18n/routing";
import { getAuthenticatedUserId } from "@/lib/auth/require-user";
import {
  getProjectReferenceAssets,
  isReferenceImageMimeType,
  MAX_PROJECT_REFERENCE_IMAGES,
} from "@/lib/assets/reference-assets";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type RegisterProductAssetResult = {
  status: "error" | "success";
};

export type RegisterReferenceAssetResult = {
  status: "error" | "limit" | "success";
};

export type UpdateCreativeDirectionState = {
  status: "error" | "idle" | "success" | "validation";
};


const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const supportedReferenceFilePattern = /^reference-[0-9a-f-]{36}\.(jpg|png|webp)$/i;

function hasValidObjectPath(userId: string, projectId: string, objectPath: string) {
  const segments = objectPath.split("/");

  return (
    segments.length === 3 &&
    segments[0] === userId &&
    segments[1] === projectId &&
    segments[2].length > 0
  );
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

    const { data: asset, error: assetError } = await supabase.from("assets").insert({
      user_id: userId,
      project_id: projectId,
      bucket_id: "product-assets",
      object_path: objectPath,
      asset_type: "product",
    }).select("id").single();

    if (assetError || !asset) {
      return { status: "error" };
    }

    // Best-effort analysis is awaited inside this Server Action.
    const [{ analyzeProductAsset }, { triggerProductAnalysisAfterRegistration }] = await Promise.all([
      import("@/lib/product-understanding/analyze-product-asset"),
      import("@/lib/product-understanding/product-analysis-trigger"),
    ]);
    await triggerProductAnalysisAfterRegistration({ assetId: asset.id, projectId, userId }, analyzeProductAsset);
  } catch {
    return { status: "error" };
  }

  revalidatePath(`/${locale}/dashboard/projects/${projectId}`, "page");

  return { status: "success" };
}

export async function reanalyzeProductAsset(assetId: unknown): Promise<import("@/lib/product-understanding/analyze-product-asset").ProductAnalysisResult> {
  if (typeof assetId !== "string" || !uuidPattern.test(assetId)) {
    return { status: "failed", reason: "asset_not_found" };
  }
  const userId = await getAuthenticatedUserId();
  if (!userId) return { status: "failed", reason: "asset_not_found" };
  const { analyzeProductAsset } = await import("@/lib/product-understanding/analyze-product-asset");
  return analyzeProductAsset({ assetId, force: true, userId });
}

export async function registerReferenceAsset(
  locale: AppLocale,
  projectId: unknown,
  objectPath: unknown,
): Promise<RegisterReferenceAssetResult> {
  if (!isSupportedLocale(locale) || typeof projectId !== "string" || typeof objectPath !== "string") {
    return { status: "error" };
  }

  const userId = await getAuthenticatedUserId();
  if (
    !userId ||
    !hasValidObjectPath(userId, projectId, objectPath) ||
    !supportedReferenceFilePattern.test(objectPath.split("/")[2] ?? "")
  ) {
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
    if (projectError || !project) return { status: "error" };

    const existingReferences = await getProjectReferenceAssets(userId, projectId);
    if (existingReferences.length >= MAX_PROJECT_REFERENCE_IMAGES) return { status: "limit" };

    const admin = getSupabaseAdminClient();
    const { data: referenceImage, error: downloadError } = await admin.storage
      .from("product-assets")
      .download(objectPath);
    if (downloadError || !referenceImage || !isReferenceImageMimeType(referenceImage.type)) {
      return { status: "error" };
    }
    if (referenceImage.size > 20 * 1024 * 1024) return { status: "error" };

    const { error: assetError } = await admin.from("assets").insert({
      user_id: userId,
      project_id: projectId,
      bucket_id: "product-assets",
      object_path: objectPath,
      asset_type: "reference_image",
    });
    if (assetError) return { status: "error" };
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
