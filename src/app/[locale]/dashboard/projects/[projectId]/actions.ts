"use server";

import { revalidatePath } from "next/cache";

import { isSupportedLocale, type AppLocale } from "@/i18n/routing";
import { getAuthenticatedUserId } from "@/lib/auth/require-user";
import {
  compositeLockedProduct,
  preparePixelLockInput,
  verifyLockedProduct,
} from "@/lib/generation/fidelity/pixel-lock";
import { ProductMaskCacheRepository } from "@/lib/generation/fidelity/product-mask-cache-repository";
import {
  resolveProductMask,
  segmentationCacheIdentity,
  type ProductMaskResolution,
} from "@/lib/generation/fidelity/product-mask-resolver";
import { getImageGenerationProvider } from "@/lib/generation/registry";
import {
  buildCreativePresetDirection,
  createCreativePresetMetadata,
} from "@/lib/creative-presets/creative-preset-context";
import { getCreativePreset } from "@/lib/creative-presets/creative-presets";
import {
  getProjectReferenceAssets,
  isReferenceImageMimeType,
  MAX_PROJECT_REFERENCE_IMAGES,
} from "@/lib/assets/reference-assets";
import {
  analyzeReferenceImages,
  getReferenceAnalysisModel,
  REFERENCE_ANALYSIS_VERSION,
} from "@/lib/generation/references/reference-analysis";
import { resolveImageGenerationOutputCanvas } from "@/lib/generation/output-canvas";
import {
  buildImageGenerationPromptWithPolicy,
} from "@/lib/generation/prompts/build-image-generation-prompt";
import { enhanceCreativeDirection } from "@/lib/generation/prompts/enhance-creative-direction";
import {
  getGenerationStrategyCategory,
  resolveGenerationStrategy,
} from "@/lib/generation/strategy/generation-strategy";
import { FalBirefnetProvider } from "@/lib/generation/segmentation/providers/fal-birefnet-provider";
import type {
  AspectRatio,
  FidelityStatus,
  GenerationProvider,
  ImageGenerationQuality,
  ProductPreservationMode,
} from "@/lib/generation/types";
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
  "provider",
  "model",
  "quality",
  "aspect_ratio",
  "preservation_mode",
  "creative_direction_snapshot",
  "provider_metadata",
].join(", ");
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const generatedAssetsBucket = "generated-assets";
const generationFailureCode = "generationFailed";
const supportedReferenceFilePattern = /^reference-[0-9a-f-]{36}\.(jpg|png|webp)$/i;

function logDevelopmentGenerationEvent(
  event: string,
  details: Record<string, boolean | number | string | null>,
) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[generation] ${event}`, details);
  }
}

type QueuedImageGenerationRow = {
  id: string;
  project_id: string;
  input_asset_id: string | null;
  generation_type: "image" | "video";
  status: "queued" | "processing" | "succeeded" | "failed";
  provider: GenerationProvider;
  model: string;
  quality: ImageGenerationQuality | null;
  aspect_ratio: AspectRatio | null;
  preservation_mode: ProductPreservationMode | null;
  creative_direction_snapshot: string;
  provider_metadata: Record<string, unknown> | null;
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

function isGenerationProvider(value: unknown): value is GenerationProvider {
  return value === "openai";
}

function resolveGenerationQuality(value: unknown): ImageGenerationQuality {
  return value === "preview" || value === "high" || value === "standard"
    ? value
    : "standard";
}

function resolveAspectRatio(value: unknown): AspectRatio {
  return value === "4:5" || value === "3:4" || value === "16:9" || value === "9:16"
    ? value
    : "1:1";
}

function resolvePreservationMode(value: unknown): ProductPreservationMode {
  return value === "pixel_lock" ? "pixel_lock" : "reference_edit";
}

async function markGenerationFailed(generationId: string, processingStartedAt: Date) {
  try {
    const admin = getSupabaseAdminClient();
    const completedAt = new Date();
    await admin
      .from("generations")
      .update({
        status: "failed",
        error_message: generationFailureCode,
        processing_completed_at: completedAt.toISOString(),
        processing_duration_ms: completedAt.getTime() - processingStartedAt.getTime(),
      })
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
      asset_type: "product",
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

export async function createQueuedImageGeneration(
  locale: AppLocale,
  projectId: string,
  _previousState: CreateQueuedImageGenerationResult | null,
  formData?: FormData,
): Promise<CreateQueuedImageGenerationResult> {
  const enhancementEnabled = formData ? formData.get("enhance_with_ai") === "on" : true;

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

    const userCreativeDirection = project.creative_direction?.trim() ?? "";
    const preset = getCreativePreset(formData?.get("preset_id"));
    const creativeDirection = buildCreativePresetDirection(userCreativeDirection, preset);
    if (!creativeDirection || Array.from(userCreativeDirection).length > 4000) {
      return { ok: false, message: "missingCreativeDirection" };
    }
    const strategyResolution = resolveGenerationStrategy({
      preset,
      userPrompt: userCreativeDirection || creativeDirection,
    });

    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select(productAssetGenerationFields)
      .eq("project_id", project.id)
      .eq("user_id", userId)
      .eq("asset_type", "product")
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

    const references = await getProjectReferenceAssets(userId, project.id);
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
        quality: "standard",
        aspect_ratio: "1:1",
        preservation_mode: strategyResolution.effectivePreservationMode,
        fidelity_status:
          strategyResolution.effectivePreservationMode === "reference_edit"
            ? "not_available"
            : "not_checked",
        creative_direction_snapshot: creativeDirection,
        provider_metadata: {
          prompt_enhancement: {
            enabled: enhancementEnabled,
            enhanced_prompt: null,
            succeeded: false,
            user_prompt: userCreativeDirection,
          },
          ...(preset ? { preset: createCreativePresetMetadata(preset) } : {}),
          strategy: {
            effective_preservation_mode: strategyResolution.effectivePreservationMode,
            reason: strategyResolution.reason,
            selected: strategyResolution.strategy,
          },
          references: {
            requested_count: references.length,
            usable_count: 0,
            asset_ids: references.map((reference) => reference.id),
            analysis: {
              enabled: references.length > 0,
              succeeded: false,
              model: references.length > 0 ? getReferenceAnalysisModel() : null,
              version: REFERENCE_ANALYSIS_VERSION,
            },
          },
        },
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

  let processingStartedAt: Date | null = null;

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
      !isGenerationProvider(queuedGeneration.provider) ||
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
    processingStartedAt = new Date();
    const { data: processingGeneration, error: processingError } = await admin
      .from("generations")
      .update({
        status: "processing",
        error_message: null,
        processing_started_at: processingStartedAt.toISOString(),
        processing_completed_at: null,
        processing_duration_ms: null,
      })
      .eq("id", queuedGeneration.id)
      .eq("project_id", project.id)
      .eq("status", "queued")
      .select("id")
      .maybeSingle();

    if (processingError || !processingGeneration) {
      return { ok: false, message: "notQueued" };
    }

    const { data: inputImage, error: downloadError } = await admin.storage
      .from(asset.bucket_id)
      .download(asset.object_path);
    if (downloadError || !inputImage) {
      throw new Error("Unable to download the input image.");
    }

    const metadataPreset = queuedGeneration.provider_metadata?.preset;
    const presetId =
      metadataPreset &&
      typeof metadataPreset === "object" &&
      "id" in metadataPreset &&
      typeof metadataPreset.id === "string"
        ? metadataPreset.id
        : null;
    const preset = getCreativePreset(presetId);
    const metadataEnhancement = queuedGeneration.provider_metadata?.prompt_enhancement;
    const metadataReferences = queuedGeneration.provider_metadata?.references;
    const requestedReferenceAssetIds = metadataReferences && typeof metadataReferences === "object" && "asset_ids" in metadataReferences && Array.isArray(metadataReferences.asset_ids)
      ? metadataReferences.asset_ids.filter((id): id is string => typeof id === "string").slice(0, MAX_PROJECT_REFERENCE_IMAGES)
      : [];
    const projectReferences = requestedReferenceAssetIds.length
      ? (await getProjectReferenceAssets(userId, project.id)).filter((reference) => requestedReferenceAssetIds.includes(reference.id))
      : [];
    const referenceImages = await Promise.all(projectReferences.map(async (reference) => {
      try {
        const { data, error } = await admin.storage.from(reference.bucket_id).download(reference.object_path);
        if (error || !data || !isReferenceImageMimeType(data.type)) return null;
        return { data: Buffer.from(await data.arrayBuffer()), mimeType: data.type };
      } catch {
        return null;
      }
    }));
    const usableReferenceImages = referenceImages.filter(
      (image): image is NonNullable<typeof image> => image !== null,
    );
    if (requestedReferenceAssetIds.length && process.env.NODE_ENV === "development") {
      console.info("[reference] analysis_started", { generationId: queuedGeneration.id, requestedCount: requestedReferenceAssetIds.length, usableCount: usableReferenceImages.length });
    }
    const referenceAnalysis = await analyzeReferenceImages(usableReferenceImages);
    if (process.env.NODE_ENV === "development" && requestedReferenceAssetIds.length) {
      console.info(referenceAnalysis.styleBrief ? "[reference] analysis_completed" : "[reference] analysis_failed", {
        generationId: queuedGeneration.id,
        model: getReferenceAnalysisModel(),
        ...(referenceAnalysis.diagnostic ?? {}),
        version: REFERENCE_ANALYSIS_VERSION,
      });
    }
    const metadataUserPrompt =
      metadataEnhancement &&
      typeof metadataEnhancement === "object" &&
      "user_prompt" in metadataEnhancement &&
      typeof metadataEnhancement.user_prompt === "string"
        ? metadataEnhancement.user_prompt.trim()
        : queuedGeneration.creative_direction_snapshot.trim();
    const fallbackCreativeDirection = buildCreativePresetDirection(metadataUserPrompt, preset);
    if (!fallbackCreativeDirection) {
      throw new Error("The generation prompt is unavailable.");
    }

    const strategyResolution = resolveGenerationStrategy({
      preset,
      requestedPreservationMode: resolvePreservationMode(queuedGeneration.preservation_mode),
      userPrompt: metadataUserPrompt || fallbackCreativeDirection,
    });
    const strategyCategory = getGenerationStrategyCategory(strategyResolution.strategy);
    const requestedPreservationMode = strategyResolution.effectivePreservationMode;
    const usesReferenceEditing = requestedPreservationMode === "reference_edit";
    logDevelopmentGenerationEvent("strategy_resolved", {
      effectivePreservationMode: strategyResolution.effectivePreservationMode,
      generationId: queuedGeneration.id,
      presetId: preset?.id ?? null,
      reason: strategyResolution.reason,
      strategy: strategyResolution.strategy,
    });
    const enhancementEnabled = !(
      metadataEnhancement &&
      typeof metadataEnhancement === "object" &&
      "enabled" in metadataEnhancement &&
      metadataEnhancement.enabled === false
    );
    const promptEnhancement = await enhanceCreativeDirection({
      enabled: enhancementEnabled,
      generationType: queuedGeneration.generation_type,
      preservationMode: requestedPreservationMode,
      productCategory: strategyCategory,
      userCreativeDirection: metadataUserPrompt,
      presetId: preset?.id,
      presetTitle: preset?.title,
      presetDescription: preset?.shortDescription,
      presetCreativeDirection: preset?.creativeDirection,
      referenceStyle: referenceAnalysis.styleBrief,
      useCase: strategyCategory,
      generationMode: preset?.generationMode,
    });
    logDevelopmentGenerationEvent("prompt_enhanced", {
      captureProfile: preset?.creativeDirection.capture?.profile ?? null,
      enhancedCreativeDirection: promptEnhancement.prompt,
      enabled: enhancementEnabled,
      generationId: queuedGeneration.id,
      presetId: preset?.id ?? null,
      success: promptEnhancement.succeeded,
      userNote: promptEnhancement.userPrompt || null,
    });
    let effectivePreservationMode = requestedPreservationMode;
    let fidelityStatus: FidelityStatus = usesReferenceEditing ? "not_available" : "not_checked";
    let fidelityScore: number | null = null;
    const fidelityMetadata: {
      effective_mode: ProductPreservationMode;
      guaranteed: boolean;
      mask_cached?: boolean;
      mask_failure_reason?:
        | Exclude<ProductMaskResolution["failureReason"], null>
        | "mask_preparation_failed";
      mask_source?: Exclude<ProductMaskResolution["source"], null>;
      product_placement?: { height: number; left: number; top: number; width: number };
      requested_mode: ProductPreservationMode;
      unavailable_reason?:
        | "reference_edit_strategy"
        | "mask_not_available"
        | "preparation_failed"
        | "verification_failed";
      verification_score?: number;
    } = {
      requested_mode: requestedPreservationMode,
      effective_mode: effectivePreservationMode,
      guaranteed: false,
      ...(usesReferenceEditing ? { unavailable_reason: "reference_edit_strategy" as const } : {}),
    };
    const aspectRatio = resolveAspectRatio(queuedGeneration.aspect_ratio);
    const outputCanvas = resolveImageGenerationOutputCanvas(aspectRatio);
    let pixelLockInput = null;

    if (requestedPreservationMode === "pixel_lock") {
      try {
        const sourceImage = Buffer.from(await inputImage.arrayBuffer());
        const maskResolution = await resolveProductMask({
          sourceImage,
          mimeType: inputImage.type || "image/png",
          cache: new ProductMaskCacheRepository({
            ...segmentationCacheIdentity,
            projectId: project.id,
            sourceAssetId: asset.id,
            userId,
          }),
          segmentationProvider: new FalBirefnetProvider(),
        });

        if (!maskResolution.mask || !maskResolution.source) {
          effectivePreservationMode = "reference_edit";
          fidelityStatus = "not_available";
          fidelityMetadata.mask_failure_reason =
            maskResolution.failureReason ?? "segmentation_provider_unavailable";
          fidelityMetadata.unavailable_reason = "mask_not_available";
          logDevelopmentGenerationEvent("mask_unavailable", {
            generationId: queuedGeneration.id,
            maskFailureReason: fidelityMetadata.mask_failure_reason ?? null,
            preservationMode: requestedPreservationMode,
          });
        } else {
          fidelityMetadata.mask_source = maskResolution.source;
          fidelityMetadata.mask_cached = maskResolution.cached;
          logDevelopmentGenerationEvent("mask_resolved", {
            generationId: queuedGeneration.id,
            maskCached: maskResolution.cached,
            maskSource: maskResolution.source,
            preservationMode: requestedPreservationMode,
          });
          pixelLockInput = await preparePixelLockInput({
            mask: maskResolution.mask,
            originalProduct: sourceImage,
            targetWidth: outputCanvas.width,
            targetHeight: outputCanvas.height,
          });
          if (!pixelLockInput) {
            effectivePreservationMode = "reference_edit";
            fidelityStatus = "not_available";
            fidelityMetadata.mask_failure_reason = "mask_preparation_failed";
            fidelityMetadata.unavailable_reason = "preparation_failed";
          } else {
            fidelityMetadata.product_placement = pixelLockInput.placement;
          }
        }
      } catch {
        effectivePreservationMode = "reference_edit";
        fidelityStatus = "not_available";
        fidelityMetadata.mask_failure_reason = "mask_preparation_failed";
        fidelityMetadata.unavailable_reason = "preparation_failed";
      }
    }

    fidelityMetadata.effective_mode = effectivePreservationMode;
    const finalPrompt = buildImageGenerationPromptWithPolicy(
      promptEnhancement.prompt,
      effectivePreservationMode,
      { strategy: strategyResolution.strategy, useCase: strategyCategory },
    );
    logDevelopmentGenerationEvent("provider_prompt_ready", {
      categoryRealism: finalPrompt.layers.categoryRealismApplied,
      captureProfile: preset?.creativeDirection.capture?.profile ?? null,
      fidelityPolicy: finalPrompt.layers.fidelityPolicy,
      finalProviderPrompt: finalPrompt.prompt,
      generationId: queuedGeneration.id,
      globalRealism: finalPrompt.layers.globalRealismApplied,
      preset: preset?.id ?? null,
      strategy: strategyResolution.strategy,
      userNote: promptEnhancement.userPrompt || null,
      visualIntent: finalPrompt.layers.visualIntent,
    });
    const result = await getImageGenerationProvider(queuedGeneration.provider).generate({
      generationId: queuedGeneration.id,
      projectId: project.id,
      sourceAsset: {
        id: asset.id,
        bucketId: asset.bucket_id,
        objectPath: asset.object_path,
        data: pixelLockInput?.productCanvas ?? inputImage,
        mimeType: pixelLockInput ? "image/png" : inputImage.type || "image/png",
      },
      prompt: finalPrompt.prompt,
      provider: queuedGeneration.provider,
      model: queuedGeneration.model,
      quality: resolveGenerationQuality(queuedGeneration.quality),
      aspectRatio,
    });

    let finalImageData = result.imageData;
    if (pixelLockInput && effectivePreservationMode === "pixel_lock") {
      try {
        finalImageData = await compositeLockedProduct({
          generatedImage: result.imageData,
          preparedInput: pixelLockInput,
        });
        const verification = await verifyLockedProduct({
          expectedProductCanvas: pixelLockInput.productCanvas,
          finalImage: finalImageData,
          mask: pixelLockInput.mask,
        });
        fidelityScore = verification.score;
        fidelityMetadata.verification_score = verification.score;
        fidelityStatus = verification.score >= 0.999 ? "locked" : "failed";
        fidelityMetadata.guaranteed = fidelityStatus === "locked";
        logDevelopmentGenerationEvent("fidelity_verified", {
          fidelityScore: verification.score,
          generationId: queuedGeneration.id,
          fidelityStatus,
        });
      } catch {
        finalImageData = result.imageData;
        effectivePreservationMode = "reference_edit";
        fidelityStatus = "failed";
        fidelityMetadata.effective_mode = effectivePreservationMode;
        fidelityMetadata.unavailable_reason = "verification_failed";
      }
    }

    const { error: uploadError } = await admin.storage
      .from(generatedAssetsBucket)
      .upload(outputObjectPath, finalImageData, {
        contentType:
          pixelLockInput && effectivePreservationMode === "pixel_lock" ? "image/png" : result.mimeType,
        upsert: false,
      });
    if (uploadError) {
      throw new Error("Unable to upload the generated image.");
    }

    const processingCompletedAt = new Date();
    const { data: completedGeneration, error: completionError } = await admin
      .from("generations")
      .update({
        status: "succeeded",
        output_bucket_id: generatedAssetsBucket,
        output_object_path: outputObjectPath,
        output_mime_type:
          pixelLockInput && effectivePreservationMode === "pixel_lock"
            ? "image/png"
            : result.mimeType,
        provider_request_id:
          typeof result.providerMetadata?.requestId === "string"
            ? result.providerMetadata.requestId
            : null,
        preservation_mode: requestedPreservationMode,
        fidelity_status: fidelityStatus,
        fidelity_score: fidelityScore,
      provider_metadata: {
          ...(result.providerMetadata ?? {}),
          fidelity: fidelityMetadata,
          prompt_enhancement: {
            enabled: enhancementEnabled,
            enhanced_prompt: promptEnhancement.enhancedPrompt,
            succeeded: promptEnhancement.succeeded,
            user_prompt: promptEnhancement.userPrompt,
          },
          ...(preset ? { preset: createCreativePresetMetadata(preset) } : {}),
          strategy: {
            effective_preservation_mode: strategyResolution.effectivePreservationMode,
            reason: strategyResolution.reason,
            selected: strategyResolution.strategy,
          },
          references: {
            requested_count: requestedReferenceAssetIds.length,
            usable_count: referenceAnalysis.usableCount,
            asset_ids: requestedReferenceAssetIds,
            analysis: {
              enabled: requestedReferenceAssetIds.length > 0,
              succeeded: referenceAnalysis.styleBrief !== null,
              model: requestedReferenceAssetIds.length > 0 ? getReferenceAnalysisModel() : null,
              version: REFERENCE_ANALYSIS_VERSION,
            },
            ...(referenceAnalysis.styleBrief ? { style_brief: referenceAnalysis.styleBrief } : {}),
          },
        },
        processing_completed_at: processingCompletedAt.toISOString(),
        processing_duration_ms: processingCompletedAt.getTime() - processingStartedAt.getTime(),
        cost_usd: null,
        error_message: null,
      })
      .eq("id", queuedGeneration.id)
      .eq("status", "processing")
      .select("id")
      .maybeSingle();
    if (completionError || !completedGeneration) {
      throw new Error("Unable to save the generated image.");
    }

    logDevelopmentGenerationEvent("succeeded", {
      effectivePreservationMode,
      fidelityStatus,
      generationId: queuedGeneration.id,
      requestedPreservationMode,
    });

    return { ok: true };
  } catch {
    logDevelopmentGenerationEvent("failed", { generationId });
    if (processingStartedAt) {
      await markGenerationFailed(generationId, processingStartedAt);
    }

    return { ok: false, message: "generationFailed" };
  }
}
