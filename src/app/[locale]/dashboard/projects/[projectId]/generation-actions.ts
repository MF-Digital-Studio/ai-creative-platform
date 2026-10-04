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
import {
  getCreativePreset,
  getHistoricalCreativePreset,
} from "@/lib/creative-presets/creative-presets";
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
import { resolveReferenceMatch } from "@/lib/generation/references/resolve-reference-match";
import { resolveReferenceGenerationPath } from "@/lib/generation/references/reference-product-replacement";
import { getReferenceShotProfile, REFERENCE_MATCH_VERSION, type ReferenceMode } from "@/lib/generation/references/reference-shot-profile";
import { buildReferenceReplacementPrompt, orderGenerationImages, orderReferenceReplacementImages, orderImageEditImages } from "@/lib/generation/image-roles";
import { buildImageEditPrompt, parseImageEditIntent } from "@/lib/image-edit/edit-intent";
import { validateImageEdit } from "@/lib/image-edit/validate-image-edit";
import { buildProductIdentityManifest } from "@/lib/product-identity/build-product-identity-manifest";
import { resolveApparelArtworkRegion, buildApparelFidelityBenchmarkPrompts, compileApparelArtworkLock } from "@/lib/product-identity/apparel-identity-manifest";
import { evaluateApparelProductFidelity, resolveApparelFidelityMode } from "@/lib/product-identity/resolve-apparel-fidelity-mode";
import { PRODUCT_IDENTITY_LOCK_VERSION } from "@/lib/product-identity/identity-lock-version";
import { resolveImageGenerationOutputCanvas } from "@/lib/generation/output-canvas";
import {
  buildImageGenerationPromptWithPolicy,
  watchOnWristInstructions,
} from "@/lib/generation/prompts/build-image-generation-prompt";
import { enhanceCreativeDirection } from "@/lib/generation/prompts/enhance-creative-direction";
import {
  getGenerationStrategyCategory,
  resolveGenerationStrategy,
} from "@/lib/generation/strategy/generation-strategy";
import { validateGenerationPolicy } from "@/lib/generation/strategy/validate-generation-policy";
import { getSafeProviderErrorDiagnostics } from "@/lib/generation/providers/provider-error-diagnostics";
import { getImageModelCapabilities } from "@/lib/generation/providers/image-model-capabilities";
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
import {
  getProductProfileForAsset,
} from "@/lib/product-understanding/analyze-product-asset";
import { compileProductProfilePrompt } from "@/lib/product-understanding/compile-product-profile-prompt";
import { resolveSceneSuitability } from "@/lib/scene-suitability/resolve-scene-suitability";
import { SCENE_SUITABILITY_VERSION } from "@/lib/scene-suitability/types";
import { resolveComposition } from "@/lib/composition-intelligence/resolve-composition";
import { COMPOSITION_INTELLIGENCE_VERSION } from "@/lib/composition-intelligence/types";
import { resolveCreativeCompliance } from "@/lib/creative-direction-compliance/resolve-compliance";
import { CREATIVE_DIRECTION_COMPLIANCE_VERSION } from "@/lib/creative-direction-compliance/compliance-version";
import { validateGeneratedImageBestEffort } from "@/lib/fidelity-validation/validate-generated-image";
import { compileRepairInstructions } from "@/lib/auto-repair/compile-repair-instructions";
import { resolveRepairPlan } from "@/lib/auto-repair/resolve-repair-plan";
import { resolveFinalCandidateSelection } from "@/lib/auto-repair/select-final-attempt";
import { AUTO_REPAIR_VERSION } from "@/lib/auto-repair/repair-version";
import type { GenerationAttempt, RepairMetadata } from "@/lib/auto-repair/types";
import { dispatchQueuedGeneration } from "@/lib/generation/dispatch-queued-generation";
import { resolveHumanRealismPolicy } from "@/lib/human-realism/human-realism-policy";
import { HUMAN_REALISM_VERSION } from "@/lib/human-realism/human-realism-version";
import { compileHumanRealismPrompt } from "@/lib/human-realism/compile-human-realism-prompt";
import type { HumanRealismMetadata } from "@/lib/generation/types";
import { resolveApparelArtworkCropEligibility, resolveHybridProjectionEligibility } from "@/lib/generation/strategy/generation-strategy";
import { resolveGenerationExecutionPolicy } from "@/lib/generation/execution-policy/resolve-generation-execution-policy";
import { resolveRepairEligibility } from "@/lib/generation/execution-policy/resolve-repair-eligibility";
import { GENERATION_EXECUTION_POLICY_VERSION } from "@/lib/generation/execution-policy/execution-policy-version";
import { createGenerationPerformanceRecorder } from "@/lib/generation/performance";

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

export type CreateImageEditResult = { ok: false; error: string; code: "creationFailed" | "missingEditInstruction" | "missingOutput" } | { ok: true; generationId: string; status: "succeeded" };

export async function createImageEdit(locale: AppLocale, projectId: string, baseGenerationId: string, instruction: string): Promise<CreateImageEditResult> {
  if (!isSupportedLocale(locale) || !uuidPattern.test(projectId) || !uuidPattern.test(baseGenerationId) || typeof instruction !== "string" || instruction.trim().length < 2 || instruction.length > 1000) return { ok: false, error: "Edit instruction is invalid.", code: "missingEditInstruction" };
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: "Edit could not be authorized.", code: "creationFailed" };
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("id,user_id").eq("id", projectId).eq("user_id", userId).maybeSingle();
  if (!project || project.user_id !== userId) return { ok: false, error: "Project could not be loaded.", code: "creationFailed" };
  const { data: base } = await supabase.from("generations").select("id,project_id,input_asset_id,generation_type,status,output_bucket_id,output_object_path,aspect_ratio,provider_metadata").eq("id", baseGenerationId).eq("project_id", projectId).maybeSingle();
  if (!base || base.generation_type !== "image" || base.status !== "succeeded" || !base.output_bucket_id || !base.output_object_path || base.output_bucket_id !== generatedAssetsBucket || !hasValidObjectPath(userId, projectId, base.output_object_path)) return { ok: false, error: "Selected output is unavailable.", code: "missingOutput" };
  const { data: asset } = await supabase.from("assets").select("id,bucket_id,object_path").eq("id", base.input_asset_id ?? "").eq("project_id", projectId).eq("user_id", userId).maybeSingle();
  if (!asset || asset.bucket_id !== "product-assets" || !hasValidObjectPath(userId, projectId, asset.object_path)) return { ok: false, error: "Source product image is unavailable.", code: "creationFailed" };
  const intent = parseImageEditIntent(instruction.trim());
  const admin = getSupabaseAdminClient();
  const { data: edit, error } = await admin.from("generations").insert({ project_id: projectId, input_asset_id: asset.id, generation_type: "image", status: "processing", provider: "openai", model: process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2.5-sunburst", quality: intent.allowedChanges.length === 1 && intent.allowedChanges[0] === "background" ? "high" : "xhigh", aspect_ratio: base.aspect_ratio ?? "1:1", preservation_mode: "reference_edit", fidelity_status: "not_checked", creative_direction_snapshot: instruction.trim(), provider_metadata: { operation: "image_edit", edit: { version: "image-edit-v1", baseGenerationId, editOfGenerationId: baseGenerationId, instruction: instruction.trim(), resolvedScopes: intent.allowedChanges, preservedElements: intent.preservedElements, validatorStatus: "pending", repairAttempted: false, editVersion: 1 } } }).select("id").single();
  if (error || !edit) return { ok: false, error: "Edit record could not be created.", code: "creationFailed" };
  const now = new Date();
  const { data: marked } = await admin.from("generations").update({ status: "processing", processing_started_at: now.toISOString() }).eq("id", edit.id).select("id").maybeSingle();
  if (!marked) return { ok: false, error: "Edit could not be started.", code: "creationFailed" };
  try {
    const [baseDownload, productDownload] = await Promise.all([admin.storage.from(base.output_bucket_id).download(base.output_object_path), admin.storage.from(asset.bucket_id).download(asset.object_path)]);
    if (baseDownload.error || !baseDownload.data || productDownload.error || !productDownload.data) throw new Error("Unable to load edit images.");
    const baseBuffer = Buffer.from(await baseDownload.data.arrayBuffer());
    const productBuffer = Buffer.from(await productDownload.data.arrayBuffer());
    const baseInput = { id: base.id, bucketId: base.output_bucket_id, objectPath: base.output_object_path, data: baseBuffer, mimeType: "image/png" };
    const productInput = { id: asset.id, bucketId: asset.bucket_id, objectPath: asset.object_path, data: productBuffer, mimeType: productDownload.data.type || "image/jpeg" };
    let result = await getImageGenerationProvider("openai").generate({ generationId: edit.id, projectId, sourceAsset: productInput, images: orderImageEditImages(baseInput, productInput), prompt: buildImageEditPrompt(instruction.trim(), intent), provider: "openai", model: process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2.5-sunburst", quality: intent.allowedChanges.length === 1 && intent.allowedChanges[0] === "background" ? "high" : "xhigh", aspectRatio: resolveAspectRatio(base.aspect_ratio), operation: "image_edit" });
    let validation = await validateImageEdit({ base: baseBuffer, edited: result.imageData, instruction: instruction.trim() });
    let repairAttempted = false;
    if (validation.status === "fail" && validation.issueCodes.some((code) => code === "EDIT_REQUEST_NOT_APPLIED" || code === "EDIT_SCOPE_OVERREACH" || code === "EDIT_PRODUCT_IDENTITY_DRIFT")) {
      repairAttempted = true;
      const previous = result.imageData;
      const repairPrompt = `Use the previous edited image and original base image. Correct only the failed edit behavior: ${validation.issueCodes.join(", ")}. Restore all unrequested elements to the base image appearance. Preserve the exact product identity.\n\nOriginal instruction: ${instruction.trim()}`;
      result = await getImageGenerationProvider("openai").generate({ generationId: edit.id, projectId, sourceAsset: productInput, images: orderImageEditImages({ ...baseInput, data: previous }, productInput), prompt: repairPrompt, provider: "openai", model: process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2.5-sunburst", quality: "xhigh", aspectRatio: resolveAspectRatio(base.aspect_ratio), operation: "image_edit" });
      validation = await validateImageEdit({ base: baseBuffer, edited: result.imageData, instruction: instruction.trim() });
    }
    if (validation.status === "fail") throw new Error("Edit fidelity validation failed.");
    const objectPath = `${userId}/${projectId}/${edit.id}.png`;
    const upload = await admin.storage.from(generatedAssetsBucket).upload(objectPath, result.imageData, { contentType: "image/png", upsert: false });
    if (upload.error) throw new Error("Unable to store edited image.");
    const processingCompletedAt = new Date();
    const { error: saveError } = await admin.from("generations").update({ status: "succeeded", output_bucket_id: generatedAssetsBucket, output_object_path: objectPath, output_mime_type: "image/png", provider_request_id: typeof result.providerMetadata?.requestId === "string" ? result.providerMetadata.requestId : null, fidelity_status: validation.status === "pass" ? "locked" : "not_checked", provider_metadata: { operation: "image_edit", edit: { version: "image-edit-v1", baseGenerationId, editOfGenerationId: baseGenerationId, instruction: instruction.trim(), resolvedScopes: intent.allowedChanges, preservedElements: intent.preservedElements, validatorStatus: validation.status, validatorIssueCodes: validation.issueCodes, repairAttempted, editVersion: 1 }, provider: result.providerMetadata ?? {} }, processing_completed_at: processingCompletedAt.toISOString(), processing_duration_ms: processingCompletedAt.getTime() - now.getTime() }).eq("id", edit.id).eq("status", "processing");
    if (saveError) throw new Error("Unable to save edited image record.");
    revalidatePath(`/${locale}/dashboard/projects/${projectId}`, "page");
    return { ok: true, generationId: edit.id, status: "succeeded" };
  } catch {
    const completedAt = new Date();
    await admin.from("generations").update({ status: "failed", error_message: generationFailureCode, processing_completed_at: completedAt.toISOString(), processing_duration_ms: completedAt.getTime() - now.getTime(), provider_metadata: { operation: "image_edit", edit: { version: "image-edit-v1", baseGenerationId, editOfGenerationId: baseGenerationId, instruction: instruction.trim(), resolvedScopes: intent.allowedChanges, preservedElements: intent.preservedElements, validatorStatus: "fail", repairAttempted: false, editVersion: 1 } } }).eq("id", edit.id).eq("status", "processing");
    return { ok: false, error: "Edit could not be completed.", code: "creationFailed" };
  }
}

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

function logDevelopmentGenerationEvent(
  event: string,
  details: Record<string, boolean | number | string | string[] | null>,
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

function safeGenerationEvent(scope: "create" | "queue", event: string, fields: Record<string, boolean | number | string | null> = {}) {
  console.info(`[generation-${scope}] ${event}`, fields);
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

export async function createQueuedImageGeneration(
  locale: AppLocale,
  projectId: string,
  _previousState: CreateQueuedImageGenerationResult | null,
  formData?: FormData,
): Promise<CreateQueuedImageGenerationResult> {
  safeGenerationEvent("create", "entered");
  const enhancementEnabled = formData ? formData.get("enhance_with_ai") === "on" : true;

  if (!isSupportedLocale(locale) || typeof projectId !== "string") {
    return { ok: false, message: "creationFailed" };
  }

  const userId = await getAuthenticatedUserId();
  safeGenerationEvent("create", "auth_resolved", { authenticated: Boolean(userId) });
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
    safeGenerationEvent("create", "project_loaded");

    const userCreativeDirection = project.creative_direction?.trim() ?? "";
    const preset = getCreativePreset(formData?.get("preset_id"));
    const creativeDirection = buildCreativePresetDirection(userCreativeDirection, preset);
    if (!creativeDirection || Array.from(userCreativeDirection).length > 4000) {
      return { ok: false, message: "missingCreativeDirection" };
    }
    safeGenerationEvent("create", "inputs_validated");
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
    safeGenerationEvent("create", "product_asset_loaded");

    const references = await getProjectReferenceAssets(userId, project.id);
    const admin = getSupabaseAdminClient();
    safeGenerationEvent("create", "insert_start");
    const { data: generation, error: generationError } = await admin
      .from("generations")
      .insert({
        project_id: project.id,
        input_asset_id: asset.id,
        generation_type: "image",
        status: "queued",
        provider: "openai",
        model: process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2.5-sunburst",
        quality: "high",
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
            mode: "inspired" satisfies ReferenceMode,
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

    safeGenerationEvent("create", "insert_success", { generationId: generation.id });
    safeGenerationEvent("queue", "created", { generationId: generation.id });
    const dispatchSucceeded = await dispatchQueuedGeneration(generation.id, () => runQueuedImageGeneration(project.id, generation.id), async (failedId) => {
      const { error: dispatchError } = await admin.from("generations").update({
        status: "failed", error_message: "dispatch_failed", processing_completed_at: new Date().toISOString(),
      }).eq("id", failedId).eq("status", "queued");
      if (dispatchError) safeGenerationEvent("queue", "queue_stalled", { generationId: failedId });
    });
    if (!dispatchSucceeded) safeGenerationEvent("queue", "queue_stalled", { generationId: generation.id, status: "failed" });

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
  const generationStartedAt = Date.now();
  let performance: ReturnType<typeof createGenerationPerformanceRecorder> | null = null;
  const executionCounts = { imageGenerationCalls: 0, visionValidationCalls: 0, promptEnhancementCalls: 0, productAnalysisCalls: 0, artworkAnalysisCalls: 0, repairCalls: 0 };
  safeGenerationEvent("queue", "processor_entered", { generationId });
  let providerDiagnosticContext: { provider: GenerationProvider; model: string; imageCount: number; preservationMode: string; strategy: string; sceneFamily: string | null } | null = null;

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
      .select("id, user_id, project_id, bucket_id, object_path, product_profile")
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
    performance = createGenerationPerformanceRecorder(queuedGeneration.id, generationStartedAt);
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
    safeGenerationEvent("queue", "status_transition", { generationId, status: "processing" });

    const { data: inputImage, error: downloadError } = await performance.measure("asset_load", () => admin.storage
      .from(asset.bucket_id)
      .download(asset.object_path));
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
    // A queued generation can reference a preset that has since left the active UI.
    // Resolve it only for replaying that historical generation, never for new selection.
    const preset = getCreativePreset(presetId) ?? getHistoricalCreativePreset(presetId);
    const metadataEnhancement = queuedGeneration.provider_metadata?.prompt_enhancement;
    const metadataReferences = queuedGeneration.provider_metadata?.references;
    const referenceMode: ReferenceMode = metadataReferences && typeof metadataReferences === "object" && "mode" in metadataReferences && metadataReferences.mode === "match" ? "match" : "inspired";
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
        return { asset: reference, data: Buffer.from(await data.arrayBuffer()), mimeType: data.type };
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
    const referenceAnalysis = await analyzeReferenceImages(usableReferenceImages.map(({ data, mimeType }) => ({ data, mimeType })));
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

    // This read validates both ownership and the persisted JSON before it can
    // influence routing. A missing/invalid profile deliberately keeps legacy
    // preset and prompt fallbacks available.
    const productProfile = await performance.measure("product_understanding", () => getProductProfileForAsset(userId, asset.id));
    let cachedLocalization: Record<string, unknown> | null = null;
    const priorArtwork = queuedGeneration.provider_metadata?.apparelArtwork;
    if (priorArtwork && typeof priorArtwork === "object" && "assetId" in priorArtwork && priorArtwork.assetId === asset.id && "version" in priorArtwork && priorArtwork.version === "apparel-artwork-localization-v1") cachedLocalization = priorArtwork as Record<string, unknown>;
    const identityManifest = buildProductIdentityManifest(productProfile);
    const apparelIdentityManifest = resolveApparelArtworkRegion({ profile: productProfile });
    const apparelFidelityMode = resolveApparelFidelityMode({ vertical: productProfile?.vertical ?? null, manifest: apparelIdentityManifest, userPrompt: metadataUserPrompt || fallbackCreativeDirection });
    let apparelArtwork: { data: Buffer; identitySource: import("@/lib/generation/types").ApparelArtworkIdentitySource; side: "front" | "back" | "unknown" } | null = null;
    if (resolveApparelArtworkCropEligibility({ vertical: productProfile?.vertical ?? null, exactProductApparel: apparelFidelityMode.exactProductApparel, artworkPresent: Boolean(apparelIdentityManifest?.artworkPresent) })) {
      const { localizeApparelArtwork, createApparelArtworkCrop } = await import("@/lib/product-identity/apparel-artwork-localization");
      const sourcePixels = Buffer.from(await inputImage.arrayBuffer());
      const cachedBoxValue = cachedLocalization?.boundingBox;
      const cachedBox = cachedBoxValue && typeof cachedBoxValue === "object" && "x" in cachedBoxValue && "y" in cachedBoxValue && "width" in cachedBoxValue && "height" in cachedBoxValue && [cachedBoxValue.x, cachedBoxValue.y, cachedBoxValue.width, cachedBoxValue.height].every((value) => typeof value === "number")
        ? { x: cachedBoxValue.x as number, y: cachedBoxValue.y as number, width: cachedBoxValue.width as number, height: cachedBoxValue.height as number }
        : null;
      const localized = cachedLocalization
        ? { detected: cachedLocalization.detected === true, side: (cachedLocalization.side === "front" || cachedLocalization.side === "back" || cachedLocalization.side === "unknown" ? cachedLocalization.side : "unknown") as "front" | "back" | "unknown", boundingBox: cachedBox, confidence: typeof cachedLocalization.confidence === "number" ? cachedLocalization.confidence : 0, containsText: cachedLocalization.containsText === true, multipleRegions: cachedLocalization.multipleRegions === true }
        : await performance.measure("artwork_localization", () => localizeApparelArtwork(sourcePixels));
      if (!cachedLocalization) executionCounts.artworkAnalysisCalls += 1;
      if (localized?.detected && localized.boundingBox) {
        const crop = await createApparelArtworkCrop({ data: sourcePixels, assetId: asset.id, side: localized.side, boundingBox: localized.boundingBox, confidence: localized.confidence, containsText: localized.containsText, detected: localized.detected });
        if (crop) apparelArtwork = { data: crop.data, identitySource: crop.identitySource, side: localized.side };
      }
      if (localized) {
        if (apparelIdentityManifest) Object.assign(apparelIdentityManifest, {
          artworkSide: localized.side,
          artworkBoundingRegion: localized.boundingBox ? { ...localized.boundingBox, confidence: "source_localization" as const } : null,
        });
      }
      logDevelopmentGenerationEvent("apparel_artwork_localization", { generationId: queuedGeneration.id, detected: Boolean(localized?.detected), localized: Boolean(apparelArtwork), side: localized?.side ?? "unknown", confidence: localized?.confidence ?? 0 });
    }
    if (apparelIdentityManifest) {
      logDevelopmentGenerationEvent("apparel_identity_lock", {
        generationId: queuedGeneration.id,
        artworkPresent: apparelIdentityManifest.artworkPresent,
        mode: apparelFidelityMode.mode,
        generationMode: apparelFidelityMode.generationMode,
        exactProductMode: apparelFidelityMode.exactProductApparel,
        artworkSide: apparelIdentityManifest.artworkSide,
      });
      logDevelopmentGenerationEvent("apparel_artwork_region_resolved", {
        generationId: queuedGeneration.id,
        artworkPresent: apparelIdentityManifest.artworkPresent,
        region: apparelIdentityManifest.artworkBoundingRegion ? JSON.stringify(apparelIdentityManifest.artworkBoundingRegion) : null,
        artworkSide: apparelIdentityManifest.artworkSide,
      });
      logDevelopmentGenerationEvent("product_fidelity_benchmark", {
        generationId: queuedGeneration.id,
        status: queuedGeneration.provider_metadata?.apparel_product_fidelity_benchmark === "passed" ? "passed" : "not_run",
        availableVariants: buildApparelFidelityBenchmarkPrompts().map(({ key }) => key),
      });
    }
    const referenceInteraction = referenceAnalysis.styleBrief
      ? getReferenceShotProfile(referenceAnalysis.styleBrief).interaction
      : null;
    const strategyResolution = resolveGenerationStrategy({
      preset,
      productProfile,
      requestedPreservationMode: resolvePreservationMode(queuedGeneration.preservation_mode),
      referenceInteraction,
      userPrompt: metadataUserPrompt || fallbackCreativeDirection,
    });
    const strategyCategory = getGenerationStrategyCategory(strategyResolution.strategy);
    const qualityUseCase = preset?.useCase ?? strategyCategory;
    const initialPreservationMode = strategyResolution.effectivePreservationMode;
    const sceneSuitability = resolveSceneSuitability({
      preset,
      productProfile,
      strategy: strategyResolution.strategy,
      userPrompt: metadataUserPrompt || fallbackCreativeDirection,
      vertical: qualityUseCase === "product" ? null : qualityUseCase,
    });
    const strategyPolicy = validateGenerationPolicy({
      strategy: strategyResolution.strategy,
      sceneFamily: sceneSuitability?.selectedSceneFamily,
      preservationMode: initialPreservationMode,
      // Mask availability is established below; this pass only resolves strategy/scene conflicts.
      hasUsableMask: true,
      vertical: productProfile?.vertical ?? null,
    });
    const strategy = strategyPolicy.strategy;
    const requestedPreservationMode = strategyPolicy.preservationMode;
    const composition = resolveComposition({
      productProfile,
      sceneFamily: sceneSuitability?.selectedSceneFamily,
      strategy,
      userPrompt: metadataUserPrompt || fallbackCreativeDirection,
      referenceStyle: referenceAnalysis.styleBrief,
      presetId: preset?.id,
    });
    const customNote = Boolean(metadataUserPrompt && metadataUserPrompt !== fallbackCreativeDirection);
    const strongPreset = Boolean(preset?.creativeDirection && composition?.source !== "safe_fallback");
    const artworkAreaRatio = apparelIdentityManifest?.artworkBoundingRegion ? apparelIdentityManifest.artworkBoundingRegion.width * apparelIdentityManifest.artworkBoundingRegion.height : 0;
    const artworkComplexity = !apparelIdentityManifest?.artworkPresent ? "none" : apparelIdentityManifest.artworkCategory === "text" || apparelIdentityManifest.artworkCategory === "mixed" || artworkAreaRatio >= .08 ? "complex_artwork" : "simple_logo";
    const executionPolicy = resolveGenerationExecutionPolicy({ productProfile, hasReference: usableReferenceImages.length > 0, referenceReplacement: usableReferenceImages.length > 0 && referenceMode === "match", exactProduct: apparelFidelityMode.exactProductApparel, artworkLocalized: Boolean(apparelArtwork), artworkComplexity, strategy, presetConfidence: strongPreset ? "high" : "low", hasCustomNote: customNote, ambiguousNote: customNote && !composition });
    console.info("[generation] execution_policy_resolved", { generationId, quality: executionPolicy.quality, difficulty: executionPolicy.difficulty, reasons: executionPolicy.reasons, promptEnhancement: executionPolicy.promptEnhancement, validationRequired: executionPolicy.validationRequired, repairEligible: executionPolicy.repairEligible });
    const creativeCompliance = resolveCreativeCompliance({
      userPrompt: metadataUserPrompt || fallbackCreativeDirection,
      productProfile,
      composition,
    });
    const referenceMatch = resolveReferenceMatch({
      productProfile,
      sceneFamily: sceneSuitability?.selectedSceneFamily,
      composition,
      creativeCompliance,
      reference: referenceAnalysis.styleBrief,
      mode: referenceMode,
    });
    const referenceGenerationPath = resolveReferenceGenerationPath({
      compatibleReferenceCount: usableReferenceImages.length,
      referenceCompatible: referenceMatch?.compatible ?? true,
      fallbackStrategy: strategy,
    });
    const usesReferenceReplacement = referenceGenerationPath.strategy === "reference_product_replacement";
    logDevelopmentGenerationEvent("reference_replacement_resolved", {
      generationId: queuedGeneration.id,
      enabled: usesReferenceReplacement,
      vertical: productProfile?.vertical ?? null,
      referenceCount: usableReferenceImages.length,
      replacementMode: usesReferenceReplacement ? "reference_product_replacement" : null,
    });
    const usesReferenceEditing = requestedPreservationMode === "reference_edit";
    logDevelopmentGenerationEvent("placement_strategy_resolved", {
      generationId: queuedGeneration.id,
      strategy: "single_pass",
    });
    logDevelopmentGenerationEvent("strategy_resolved", {
      effectivePreservationMode: requestedPreservationMode,
      generationId: queuedGeneration.id,
      presetId: preset?.id ?? null,
      productProfileVertical: productProfile?.vertical ?? null,
      reason: strategyResolution.reason,
      strategy,
    });
    if (sceneSuitability) {
      logDevelopmentGenerationEvent("scene_suitability_resolved", {
        confidence: sceneSuitability.confidence,
        generationId: queuedGeneration.id,
        selectedSceneFamily: sceneSuitability.selectedSceneFamily,
        source: sceneSuitability.source,
        subcategory: productProfile?.subcategory ?? null,
        suitableFamilyCount: sceneSuitability.suitableSceneFamilies.length,
        vertical: productProfile?.vertical ?? qualityUseCase,
      });
    }
    if (composition) {
      logDevelopmentGenerationEvent("composition_resolved", {
        cameraDistance: composition.cameraDistance,
        depthOfField: composition.depthOfField,
        framing: composition.framing,
        generationId: queuedGeneration.id,
        productDominance: composition.productDominance,
        sceneFamily: sceneSuitability?.selectedSceneFamily ?? null,
        source: composition.source,
        subjectScale: composition.subjectScale,
      });
    }
    logDevelopmentGenerationEvent("creative_compliance_resolved", {
      adjustedCompositionCount: creativeCompliance.adjustedForComposition.length,
      appliedCount: creativeCompliance.applied.length,
      generationId: queuedGeneration.id,
      rejectedIdentityCount: creativeCompliance.requirements.filter(({ status }) => status === "rejected_identity_conflict").length,
      totalRequirements: creativeCompliance.requirements.length,
    });
    if (referenceMatch) {
      logDevelopmentGenerationEvent("reference_match_resolved", {
        generationId: queuedGeneration.id,
        mode: referenceMatch.mode,
        compatible: referenceMatch.compatible,
        appliedCategories: [...new Set([
          referenceMatch.compositionAdjustments.length ? "composition" : "",
          referenceMatch.interactionAdjustments.length ? "interaction" : "",
          referenceMatch.styleAdjustments.length ? "style" : "",
        ].filter(Boolean))],
      });
    }
    const userAllowsEnhancement = !(
      metadataEnhancement &&
      typeof metadataEnhancement === "object" &&
      "enabled" in metadataEnhancement &&
      metadataEnhancement.enabled === false
    );
    const enhancementEnabled = userAllowsEnhancement && executionPolicy.promptEnhancement;
    const promptEnhancement = await performance.measure("prompt_enhancement", () => enhanceCreativeDirection({
      enabled: enhancementEnabled,
      generationType: queuedGeneration.generation_type,
      preservationMode: requestedPreservationMode,
      productCategory: qualityUseCase,
      userCreativeDirection: metadataUserPrompt,
      presetId: preset?.id,
      presetTitle: preset?.title,
      presetDescription: preset?.shortDescription,
      presetCreativeDirection: preset?.creativeDirection,
      referenceStyle: referenceAnalysis.styleBrief,
      useCase: qualityUseCase,
      generationMode: preset?.generationMode,
    }));
    if (enhancementEnabled && promptEnhancement.succeeded) executionCounts.promptEnhancementCalls += 1;
    logDevelopmentGenerationEvent("prompt_enhanced", {
      captureProfile: preset?.creativeDirection.capture?.profile ?? null,
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
    const logPixelLockFallback = () => logDevelopmentGenerationEvent("preservation_mode_fallback", {
      generationId: queuedGeneration.id,
      requested: "pixel_lock",
      effective: "reference_edit",
      reason: "mask_unavailable",
    });

    if (requestedPreservationMode === "pixel_lock" && !usesReferenceReplacement) {
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
          logPixelLockFallback();
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
            logPixelLockFallback();
          } else {
            fidelityMetadata.product_placement = pixelLockInput.placement;
          }
        }
      } catch {
        effectivePreservationMode = "reference_edit";
        fidelityStatus = "not_available";
        fidelityMetadata.mask_failure_reason = "mask_preparation_failed";
        fidelityMetadata.unavailable_reason = "preparation_failed";
        logPixelLockFallback();
      }
    }

    fidelityMetadata.effective_mode = effectivePreservationMode;
    const providerProductAsset = {
      id: asset.id,
      bucketId: asset.bucket_id,
      objectPath: asset.object_path,
      data: pixelLockInput?.productCanvas ?? inputImage,
      mimeType: pixelLockInput ? "image/png" : inputImage.type || "image/png",
    };
    const generationImages = usesReferenceReplacement
      ? orderReferenceReplacementImages({
        id: usableReferenceImages[0].asset.id,
        bucketId: usableReferenceImages[0].asset.bucket_id,
        objectPath: usableReferenceImages[0].asset.object_path,
        data: usableReferenceImages[0].data,
        mimeType: usableReferenceImages[0].mimeType,
      }, providerProductAsset)
      : orderGenerationImages(providerProductAsset, usableReferenceImages.map(({ asset: reference, data, mimeType }) => ({
      id: reference.id,
      bucketId: reference.bucket_id,
      objectPath: reference.object_path,
      data,
      mimeType,
    })), apparelArtwork ? { id: asset.id, bucketId: asset.bucket_id, objectPath: asset.object_path, data: apparelArtwork.data, mimeType: "image/png" } : null);
    const finalPrompt = buildImageGenerationPromptWithPolicy(
      promptEnhancement.prompt,
      effectivePreservationMode,
      { strategy, useCase: qualityUseCase, productProfile, sceneSuitability, composition, creativeCompliance, referenceMatch, identityManifest, generationImages, apparelIdentityManifest, exactProductApparel: apparelFidelityMode.exactProductApparel, visibleHuman: ["fashion_on_model", "jewelry_on_model", "watch_on_wrist", "footwear_on_model"].includes(strategy) || strategy === "rigid_product" && qualityUseCase === "cosmetics" },
    );
    logDevelopmentGenerationEvent("product_identity_lock", {
      generationId: queuedGeneration.id,
      vertical: identityManifest.vertical,
      identityAnchorCount: identityManifest.immutableAttributes.length + identityManifest.geometryAnchors.length + identityManifest.colorMaterialAnchors.length + identityManifest.brandingAnchors.length,
      sourceImageRoleApplied: generationImages[0]?.role === "product_identity_source",
      referenceCount: generationImages.length - 1,
      version: PRODUCT_IDENTITY_LOCK_VERSION,
    });
    logDevelopmentGenerationEvent("product_profile_prompt", {
      generationId: queuedGeneration.id,
      vertical: productProfile?.vertical ?? null,
      subcategory: productProfile?.subcategory ?? null,
      identityRuleCount: finalPrompt.layers.productProfileApplied && productProfile
        ? compileProductProfilePrompt(productProfile).identity.length : 0,
      interactionRuleCount: finalPrompt.layers.productProfileApplied && productProfile
        ? compileProductProfilePrompt(productProfile).interaction.length : 0,
      forbiddenRuleCount: finalPrompt.layers.productProfileApplied && productProfile
        ? compileProductProfilePrompt(productProfile).forbidden.length : 0,
      status: finalPrompt.layers.productProfileApplied ? "applied" : asset.product_profile === null ? "missing" : "invalid",
    });
    logDevelopmentGenerationEvent("generation_policy_resolved", {
      footwear_v2: finalPrompt.layers.footwearV2Applied,
      generationId: queuedGeneration.id,
      jewelry_v2: finalPrompt.layers.jewelryV2Applied,
      resolvedStrategy: strategy,
      resolvedVertical: finalPrompt.layers.vertical,
      watch_v2: finalPrompt.layers.watchV2Applied,
    });
    const finalPolicy = validateGenerationPolicy({
      strategy,
      sceneFamily: sceneSuitability?.selectedSceneFamily,
      preservationMode: effectivePreservationMode,
      hasUsableMask: pixelLockInput !== null,
      vertical: productProfile?.vertical ?? null,
    });
    if (effectivePreservationMode === "pixel_lock" && finalPolicy.preservationMode === "reference_edit") {
      logDevelopmentGenerationEvent("preservation_mode_fallback", {
        generationId: queuedGeneration.id, requested: "pixel_lock", effective: "reference_edit", reason: "mask_unavailable",
      });
      fidelityStatus = "not_available";
      fidelityMetadata.unavailable_reason = "mask_not_available";
    }
    effectivePreservationMode = finalPolicy.preservationMode;
    fidelityMetadata.effective_mode = effectivePreservationMode;
    let activePrompt = usesReferenceReplacement
      ? `${buildReferenceReplacementPrompt(promptEnhancement.prompt)}${strategy === "watch_on_wrist" ? `\n\n${watchOnWristInstructions}` : ""}${apparelIdentityManifest ? `\n\n${compileApparelArtworkLock(apparelIdentityManifest)}` : ""}`
      : finalPrompt.prompt;
    const humanRealismPolicy = resolveHumanRealismPolicy({ strategy, vertical: productProfile?.vertical ?? finalPrompt.layers.vertical, visibleHuman: finalPrompt.layers.humanRealismApplied || strategy === "rigid_product" && qualityUseCase === "cosmetics" });
    const humanRealismDirection = compileHumanRealismPrompt(humanRealismPolicy, productProfile?.vertical ?? finalPrompt.layers.vertical);
    if (humanRealismDirection && !activePrompt.includes(humanRealismDirection)) activePrompt = `${activePrompt}\n\n${humanRealismDirection}`;
    let hybridProjectionMetadata: Record<string, unknown> | null = null;

    if (usesReferenceReplacement) {
      logDevelopmentGenerationEvent("reference_replacement_inputs", {
        generationId: queuedGeneration.id,
        baseSceneCount: 1,
        productIdentityCount: 1,
      });
    }

    providerDiagnosticContext = {
      provider: queuedGeneration.provider, model: queuedGeneration.model, imageCount: generationImages.length,
      preservationMode: effectivePreservationMode, strategy: finalPolicy.strategy,
      sceneFamily: finalPolicy.sceneFamily,
    };
    const imageModelCapabilities = getImageModelCapabilities(queuedGeneration.model);
    logDevelopmentGenerationEvent("image_model_capabilities", {
      generationId: queuedGeneration.id,
      model: queuedGeneration.model,
      explicitInputFidelity: imageModelCapabilities.supportsExplicitInputFidelity,
      imageCount: generationImages.length,
    });
    const result = await performance.measure("provider_initial", () => getImageGenerationProvider(queuedGeneration.provider).generate({
      generationId: queuedGeneration.id,
      projectId: project.id,
      sourceAsset: providerProductAsset,
      images: generationImages,
      prompt: activePrompt,
      provider: queuedGeneration.provider,
      model: queuedGeneration.model,
      quality: executionPolicy.quality,
      aspectRatio,
      ...(usesReferenceReplacement ? { operation: "reference_product_replacement" as const } : {}),
    }));
    executionCounts.imageGenerationCalls += 1;
    providerDiagnosticContext = null;

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

    const originalMimeType = pixelLockInput && effectivePreservationMode === "pixel_lock" ? "image/png" : result.mimeType;
    const inputPixels = Buffer.from(await inputImage.arrayBuffer());
    const fidelityValidation = await performance.measure("validation_initial", () => validateGeneratedImageBestEffort({
      originalProduct: inputPixels,
      generatedImage: finalImageData,
      originalMimeType: inputImage.type || "image/png",
      ...(usesReferenceReplacement ? { referenceBaseScene: usableReferenceImages[0].data, referenceBaseSceneMimeType: usableReferenceImages[0].mimeType } : {}),
      generatedMimeType: originalMimeType,
      productProfile,
      vertical: productProfile?.vertical ?? (strategyCategory === "product" ? "product" : strategyCategory),
      strategy: finalPolicy.strategy,
      sceneSuitability,
      composition,
      creativeCompliance,
      referenceStyleContext: referenceAnalysis.styleBrief ? JSON.stringify(referenceAnalysis.styleBrief) : null,
      referenceMatch,
      identityManifest,
      ...(apparelArtwork ? { apparelArtworkIdentity: { data: apparelArtwork.data, mimeType: "image/png", containsText: apparelArtwork.identitySource.containsText, side: apparelArtwork.side, confidence: apparelArtwork.identitySource.confidence } } : {}),
      exactProductApparel: apparelFidelityMode.exactProductApparel,
    }));
    executionCounts.visionValidationCalls += fidelityValidation.status === "validation_unavailable" ? 0 : 1;
    const hybridEligible = resolveHybridProjectionEligibility({ vertical: productProfile?.vertical ?? null, artworkPresent: Boolean(apparelArtwork), exactProductApparel: apparelFidelityMode.exactProductApparel, artworkSide: apparelArtwork?.side ?? "unknown", localized: Boolean(apparelArtwork) });
    if (hybridEligible && apparelArtwork && apparelIdentityManifest?.artworkBoundingRegion) {
      try {
        const projection = await import("@/lib/apparel-projection/project-artwork");
        const artworkBox = apparelIdentityManifest.artworkBoundingRegion;
        const projected = await performance.measure("hybrid_projection", () => projection.projectApparelArtwork({ sourceImage: inputPixels, artworkCrop: apparelArtwork.data, artworkBox, generatedImage: finalImageData, side: apparelArtwork.side as "front" | "back", generationId: queuedGeneration.id, log: (event, fields) => console.info(`[hybrid-projection] ${event}`, fields) }));
        finalImageData = projected.image;
        hybridProjectionMetadata = { ...projected.metadata };
      } catch (error) {
        if (error instanceof Error && error.name === "SharpRuntimeUnavailableError") {
          console.warn("[hybrid-projection] runtime_unavailable");
          hybridProjectionMetadata = { enabled: true, applied: false, fallbackReason: "runtime_unavailable", version: "hybrid-apparel-projection-v1", artworkExtractionMode: "unavailable", garmentSurfaceConfidence: 0, warpMode: "unavailable", validationStatus: "unavailable" };
        } else throw error;
      }
    }
    const originalValidationIssueCounts = {
      critical: fidelityValidation.issues.filter(({ severity }) => severity === "critical").length,
      major: fidelityValidation.issues.filter(({ severity }) => severity === "major").length,
      minor: fidelityValidation.issues.filter(({ severity }) => severity === "minor").length,
    };
    const originalIdentityIssueCounts = {
      critical: fidelityValidation.issues.filter(({ identityImpact, severity }) => identityImpact === "critical" && severity === "critical").length,
      major: fidelityValidation.issues.filter(({ identityImpact, severity }) => identityImpact === "major" && severity === "major").length,
    };
    console.info("[generation] calibrated_validation", {
      status: fidelityValidation.status,
      commerciallyUsable: fidelityValidation.commerciallyUsable,
      criticalIssueCount: originalValidationIssueCounts.critical,
      majorIssueCount: originalValidationIssueCounts.major,
      minorIssueCount: originalValidationIssueCounts.minor,
      identityCriticalIssueCount: originalIdentityIssueCounts.critical,
      identityMajorIssueCount: originalIdentityIssueCounts.major,
    });
    if (fidelityValidation.status === "validation_unavailable") {
      logDevelopmentGenerationEvent("fidelity_validation_unavailable", {
        generationId: queuedGeneration.id,
        reason: fidelityValidation.summary,
      });
    } else {
      logDevelopmentGenerationEvent("fidelity_validation", {
        generationId: queuedGeneration.id,
        status: fidelityValidation.status,
        criticalIssueCount: originalValidationIssueCounts.critical,
        majorIssueCount: originalValidationIssueCounts.major,
        minorIssueCount: originalValidationIssueCounts.minor,
        identityCriticalIssueCount: originalIdentityIssueCounts.critical,
        identityMajorIssueCount: originalIdentityIssueCounts.major,
        retryRecommended: fidelityValidation.retryRecommended,
      });
    }
    if (usesReferenceReplacement) {
      logDevelopmentGenerationEvent("reference_preservation_validation", {
        generationId: queuedGeneration.id,
        status: fidelityValidation.status,
        changedSceneAreas: fidelityValidation.issues.filter(({ category }) => category === "reference_match").map(({ code }) => code).slice(0, 8),
        productIdentityStatus: originalIdentityIssueCounts.critical + originalIdentityIssueCounts.major === 0 ? "pass" : "issues_found",
      });
    }

    const projectionReady = hybridProjectionMetadata?.applied === true;
    const repairEligibility = resolveRepairEligibility({ validation: fidelityValidation, exactProduct: apparelFidelityMode.exactProductApparel, hybridProjectionApplied: hybridProjectionMetadata?.applied === true, hybridProjectionEnabled: hybridEligible, hybridProjectionReady: projectionReady, maximumAttemptsRemaining: true });
    const mappedRepairPlan = resolveRepairPlan(fidelityValidation);
    const repairPlan = repairEligibility.eligible ? mappedRepairPlan : { ...mappedRepairPlan, shouldRetry: false, categories: [], issueCodes: [], repairInstructions: [] };
    logDevelopmentGenerationEvent("auto_repair_decision", {
      generationId: queuedGeneration.id,
      shouldRetry: repairPlan.shouldRetry,
      issueCodes: repairPlan.issueCodes,
      categories: repairPlan.categories,
      repairExpectedValue: repairEligibility.repairExpectedValue,
      reason: repairEligibility.reason,
      quality: executionPolicy.repairQuality,
    });

    const originalAttempt: GenerationAttempt = {
      attempt: 0,
      imageData: finalImageData,
      mimeType: originalMimeType,
      validation: fidelityValidation,
      providerRequestId: typeof result.providerMetadata?.requestId === "string" ? result.providerMetadata.requestId : null,
      preservationMode: effectivePreservationMode,
    };
    let repairAttempt: GenerationAttempt | null = null;
    let selectedProviderResult = result;

    if (repairPlan.shouldRetry) {
      logDevelopmentGenerationEvent("auto_repair_started", {
        generationId: queuedGeneration.id,
        attempt: 1,
      });
      try {
        const repairResult = await performance.measure("provider_repair", () => getImageGenerationProvider(queuedGeneration.provider).generate({
          generationId: queuedGeneration.id,
          projectId: project.id,
          sourceAsset: providerProductAsset,
          images: generationImages,
          prompt: compileRepairInstructions(activePrompt, repairPlan),
          provider: queuedGeneration.provider,
          model: queuedGeneration.model,
          quality: executionPolicy.repairQuality,
          aspectRatio,
          ...(usesReferenceReplacement ? { operation: "reference_product_replacement" as const } : {}),
        }));
        executionCounts.imageGenerationCalls += 1;
        executionCounts.repairCalls = 1;
        let repairImageData = repairResult.imageData;
        let repairMimeType = repairResult.mimeType;
        if (pixelLockInput && effectivePreservationMode === "pixel_lock") {
          try {
            repairImageData = await compositeLockedProduct({ generatedImage: repairResult.imageData, preparedInput: pixelLockInput });
            await verifyLockedProduct({ expectedProductCanvas: pixelLockInput.productCanvas, finalImage: repairImageData, mask: pixelLockInput.mask });
            repairMimeType = "image/png";
          } catch {
            repairImageData = repairResult.imageData;
          }
        }
        const repairValidation = await performance.measure("validation_repair", () => validateGeneratedImageBestEffort({
          originalProduct: inputPixels,
          generatedImage: repairImageData,
          originalMimeType: inputImage.type || "image/png",
          ...(usesReferenceReplacement ? { referenceBaseScene: usableReferenceImages[0].data, referenceBaseSceneMimeType: usableReferenceImages[0].mimeType } : {}),
          generatedMimeType: repairMimeType,
          productProfile,
          vertical: productProfile?.vertical ?? (strategyCategory === "product" ? "product" : strategyCategory),
          strategy: finalPolicy.strategy,
          sceneSuitability,
          composition,
          creativeCompliance,
          referenceStyleContext: referenceAnalysis.styleBrief ? JSON.stringify(referenceAnalysis.styleBrief) : null,
          referenceMatch,
          identityManifest,
          ...(apparelArtwork ? { apparelArtworkIdentity: { data: apparelArtwork.data, mimeType: "image/png", containsText: apparelArtwork.identitySource.containsText, side: apparelArtwork.side, confidence: apparelArtwork.identitySource.confidence } } : {}),
          exactProductApparel: apparelFidelityMode.exactProductApparel,
        }));
        executionCounts.visionValidationCalls += repairValidation.status === "validation_unavailable" ? 0 : 1;
        const repairIssueCounts = {
          critical: repairValidation.issues.filter(({ severity }) => severity === "critical").length,
          major: repairValidation.issues.filter(({ severity }) => severity === "major").length,
          minor: repairValidation.issues.filter(({ severity }) => severity === "minor").length,
        };
        const repairIdentityIssueCounts = {
          critical: repairValidation.issues.filter(({ category, severity }) => category === "product_identity" && severity === "critical").length,
          major: repairValidation.issues.filter(({ category, severity }) => category === "product_identity" && severity === "major").length,
        };
        logDevelopmentGenerationEvent("auto_repair_validated", {
          generationId: queuedGeneration.id,
          status: repairValidation.status,
          criticalIssueCount: repairIssueCounts.critical,
          majorIssueCount: repairIssueCounts.major,
          minorIssueCount: repairIssueCounts.minor,
          identityCriticalIssueCount: repairIdentityIssueCounts.critical,
          identityMajorIssueCount: repairIdentityIssueCounts.major,
        });
        repairAttempt = {
          attempt: 1,
          imageData: repairImageData,
          mimeType: repairMimeType,
          validation: repairValidation,
          providerRequestId: typeof repairResult.providerMetadata?.requestId === "string" ? repairResult.providerMetadata.requestId : null,
          preservationMode: effectivePreservationMode,
        };
      } catch {
        logDevelopmentGenerationEvent("auto_repair_validated", {
          generationId: queuedGeneration.id,
          status: "validation_unavailable",
          criticalIssueCount: 0,
          majorIssueCount: 0,
          minorIssueCount: 0,
        });
      }
    }

    const finalSelection = resolveFinalCandidateSelection(originalAttempt, repairAttempt, (attempt) => {
      const statusAccepted = attempt.validation.status === "pass" || attempt.validation.status === "pass_with_warnings";
      if (!apparelFidelityMode.productFidelityFirst || !apparelIdentityManifest || attempt.validation.status === "validation_unavailable") return statusAccepted;
      const gate = evaluateApparelProductFidelity({ validationStatus: attempt.validation.status, issueCodes: attempt.validation.issues.map(({ code }) => code), benchmarkStatus: queuedGeneration.provider_metadata?.apparel_product_fidelity_benchmark === "passed" ? "passed" : "not_run" });
      return statusAccepted && gate.qualityGatePassed;
    });
    const selectedAttempt = finalSelection.attempt;
    if (selectedAttempt.attempt === 1 && repairAttempt) selectedProviderResult = { ...result, providerMetadata: repairAttempt.providerRequestId ? { requestId: repairAttempt.providerRequestId } : undefined };
    finalImageData = selectedAttempt.imageData;
    const selectedMimeType = selectedAttempt.mimeType;
    const selectedValidation = selectedAttempt.validation;
    const apparelFidelityGate = apparelFidelityMode.productFidelityFirst
      ? evaluateApparelProductFidelity({
        validationStatus: selectedValidation.status,
        issueCodes: selectedValidation.issues.map(({ code }) => code),
        benchmarkStatus: queuedGeneration.provider_metadata?.apparel_product_fidelity_benchmark === "passed" ? "passed" : "not_run",
      })
      : null;
    const qualityGatePassed = finalSelection.qualityGatePassed && (apparelFidelityGate?.qualityGatePassed ?? true);
    if (selectedValidation.status === "validation_unavailable") fidelityStatus = "not_available";
    else if (selectedValidation.status === "fail" || !qualityGatePassed) fidelityStatus = "failed";
    else if (fidelityStatus !== "locked") fidelityStatus = selectedValidation.status === "pass" || selectedValidation.status === "pass_with_warnings" ? "locked" : "not_checked";
    if (apparelFidelityGate) {
      logDevelopmentGenerationEvent("product_fidelity_quality_gate", {
        generationId: queuedGeneration.id,
        productFidelityReady: apparelFidelityGate.productFidelityReady,
        qualityGatePassed: apparelFidelityGate.qualityGatePassed,
        failedCodes: apparelFidelityGate.failedCodes.slice(0, 8),
      });
    }
    const repairMetadata: RepairMetadata = {
      version: AUTO_REPAIR_VERSION,
      attempted: repairPlan.shouldRetry,
      selectedAttempt: selectedAttempt.attempt,
      repairCategories: repairPlan.categories,
      originalValidationStatus: fidelityValidation.status,
      repairValidationStatus: repairAttempt?.validation.status ?? null,
    };
    logDevelopmentGenerationEvent("final_candidate_selected", {
      generationId: queuedGeneration.id,
      selectedAttempt: selectedAttempt.attempt,
      reason: finalSelection.reason,
      initialValidationStatus: fidelityValidation.status,
      repairValidationStatus: repairAttempt?.validation.status ?? null,
      qualityGatePassed,
    });
    const validationIssueCounts = {
      critical: selectedValidation.issues.filter(({ severity }) => severity === "critical").length,
      major: selectedValidation.issues.filter(({ severity }) => severity === "major").length,
      minor: selectedValidation.issues.filter(({ severity }) => severity === "minor").length,
    };

    const { error: uploadError } = await performance.measure("storage", () => admin.storage
      .from(generatedAssetsBucket)
      .upload(outputObjectPath, finalImageData, {
        contentType:
          selectedMimeType,
        upsert: false,
      }));
    if (uploadError) {
      throw new Error("Unable to upload the generated image.");
    }

    const processingCompletedAt = new Date();
    const humanRealismMetadata: HumanRealismMetadata = {
      version: HUMAN_REALISM_VERSION,
      applied: humanRealismPolicy.applied,
      focusAreas: humanRealismPolicy.focusAreas,
      validationResult: selectedValidation.status,
      repairType: selectedAttempt.attempt === 1 ? repairPlan.categories.join(",") || "repair" : null,
    };
    const stageDurations = performance.finish();
    const { data: completedGeneration, error: completionError } = await admin
      .from("generations")
      .update({
        status: "succeeded",
        output_bucket_id: generatedAssetsBucket,
        output_object_path: outputObjectPath,
        output_mime_type:
          selectedMimeType,
        provider_request_id:
          typeof selectedProviderResult.providerMetadata?.requestId === "string"
            ? selectedProviderResult.providerMetadata.requestId
            : null,
        preservation_mode: effectivePreservationMode,
        fidelity_status: fidelityStatus,
        fidelity_score: fidelityScore,
      provider_metadata: {
          ...(selectedProviderResult.providerMetadata ?? {}),
          execution: { version: GENERATION_EXECUTION_POLICY_VERSION, imageGenerationCalls: executionCounts.imageGenerationCalls, visionValidationCalls: executionCounts.visionValidationCalls, promptEnhancementCalls: executionCounts.promptEnhancementCalls, productAnalysisCalls: executionCounts.productAnalysisCalls, artworkAnalysisCalls: executionCounts.artworkAnalysisCalls, repairCalls: executionCounts.repairCalls, repairSuppressed: !repairPlan.shouldRetry && fidelityValidation.status === "fail", repairSuppressionReason: !repairPlan.shouldRetry && fidelityValidation.status === "fail" ? repairEligibility.reason : null, avoidedImageGenerationCalls: !repairPlan.shouldRetry && fidelityValidation.status === "fail" ? 1 : 0, totalDurationMs: stageDurations.total, stages: stageDurations, quality: executionPolicy.quality, difficulty: executionPolicy.difficulty, reasons: executionPolicy.reasons, repairQuality: repairPlan.shouldRetry ? executionPolicy.repairQuality : null, repairExpectedValue: repairEligibility.repairExpectedValue },
          ...(apparelIdentityManifest ? { apparelArtwork: { version: "apparel-artwork-localization-v1", assetId: asset.id, detected: apparelArtwork !== null, side: apparelIdentityManifest.artworkSide, boundingBox: apparelIdentityManifest.artworkBoundingRegion ? { x: apparelIdentityManifest.artworkBoundingRegion.x, y: apparelIdentityManifest.artworkBoundingRegion.y, width: apparelIdentityManifest.artworkBoundingRegion.width, height: apparelIdentityManifest.artworkBoundingRegion.height } : null, confidence: apparelArtwork?.identitySource.confidence ?? 0, containsText: apparelArtwork?.identitySource.containsText ?? false, multipleRegions: false, identitySource: apparelArtwork?.identitySource ?? null } } : {}),
          providerStatus: "succeeded",
          qualityGatePassed,
          qualityRejected: finalSelection.validationStatus === "validation_unavailable" ? false : !qualityGatePassed,
          humanRealism: humanRealismMetadata,
          ...(apparelArtwork ? { apparelArtwork: { version: "apparel-artwork-identity-source-v2", detected: true, side: apparelArtwork.side, identitySource: apparelArtwork.identitySource } } : apparelIdentityManifest ? { apparelArtwork: { version: "apparel-artwork-identity-source-v2", detected: false, side: apparelIdentityManifest.artworkSide, identitySource: null } } : {}),
          ...(hybridEligible ? { apparelProjection: hybridProjectionMetadata ?? { enabled: true, applied: false, fallbackReason: "projection_unavailable", version: "hybrid-apparel-projection-v1", artworkExtractionMode: "unavailable", garmentSurfaceConfidence: 0, warpMode: "unavailable", validationStatus: "not_applied" } } : {}),
          ...(apparelIdentityManifest ? { apparel_identity: {
            manifest: apparelIdentityManifest,
            artworkPresent: apparelIdentityManifest.artworkPresent,
            artworkRegion: apparelIdentityManifest.artworkBoundingRegion,
            artworkSide: apparelIdentityManifest.artworkSide,
            fidelityGate: apparelFidelityGate?.productFidelityReady ?? null,
            exactProductModeEnabled: apparelFidelityMode.exactProductApparel,
            productFidelityFirst: apparelFidelityMode.productFidelityFirst,
            fidelityMode: apparelFidelityMode.mode,
            generationMode: apparelFidelityMode.generationMode,
          } } : {}),
          ...(usesReferenceReplacement ? { referenceReplacement: {
            version: "reference-product-replacement-v1",
            enabled: true,
            baseScenePreserved: selectedValidation.status === "pass",
            productReplacementApplied: selectedValidation.status !== "validation_unavailable",
          } } : {}),
          fidelity: fidelityMetadata,
          fidelity_validation: {
            version: selectedValidation.version,
            status: selectedValidation.status,
            commerciallyUsable: selectedValidation.commerciallyUsable,
            criticalIssueCount: validationIssueCounts.critical,
            majorIssueCount: validationIssueCounts.major,
            minorIssueCount: validationIssueCounts.minor,
            retryRecommended: selectedValidation.retryRecommended,
            issueCodes: selectedValidation.issues.map(({ code }) => code).slice(0, 20),
            warnings: selectedValidation.issues.filter(({ severity }) => severity === "minor" || severity === "major" && selectedValidation.status !== "fail").map(({ code, finding }) => ({ code, finding })).slice(0, 20),
          },
          validation: {
            version: selectedValidation.version,
            status: selectedValidation.status,
            commerciallyUsable: selectedValidation.commerciallyUsable,
            criticalIssueCount: validationIssueCounts.critical,
            majorIssueCount: validationIssueCounts.major,
            minorIssueCount: validationIssueCounts.minor,
            warnings: selectedValidation.issues.filter(({ severity }) => severity === "minor" || severity === "major" && selectedValidation.status !== "fail").map(({ code, finding, confidence, likelyCause }) => ({ code, finding, confidence, likelyCause })).slice(0, 20),
            issueCodes: selectedValidation.issues.map(({ issueCode, code }) => issueCode ?? code).slice(0, 20),
          },
          auto_repair: repairMetadata,
          product_identity_lock: {
            version: PRODUCT_IDENTITY_LOCK_VERSION,
            vertical: identityManifest.vertical,
            identityAnchorCount: identityManifest.immutableAttributes.length + identityManifest.geometryAnchors.length + identityManifest.colorMaterialAnchors.length + identityManifest.brandingAnchors.length,
            imageOrderingVersion: "generation-image-order-v1",
            placementStrategy: "single_pass",
          },
          placement: {
            version: "single-pass-placement-v1",
            strategy: "single_pass",
          },
          ...(referenceMatch ? {
            reference_match: {
              version: REFERENCE_MATCH_VERSION,
              mode: referenceMatch.mode,
              compatible: referenceMatch.compatible,
              primaryReferenceAssetId: requestedReferenceAssetIds[0] ?? null,
              appliedAttributeCategories: [...new Set([
                referenceMatch.compositionAdjustments.length ? "composition" : "",
                referenceMatch.interactionAdjustments.length ? "interaction" : "",
                referenceMatch.styleAdjustments.length ? "style" : "",
              ].filter(Boolean))],
            },
          } : {}),
          prompt_enhancement: {
            enabled: enhancementEnabled,
            enhanced_prompt: promptEnhancement.enhancedPrompt,
            succeeded: promptEnhancement.succeeded,
            user_prompt: promptEnhancement.userPrompt,
          },
          ...(preset ? { preset: createCreativePresetMetadata(preset) } : {}),
          strategy: {
            effective_preservation_mode: effectivePreservationMode,
            reason: strategyResolution.reason,
            selected: finalPolicy.strategy,
          },
          ...(sceneSuitability ? { scene_suitability: {
            version: SCENE_SUITABILITY_VERSION,
            selectedSceneFamily: sceneSuitability.selectedSceneFamily,
            source: sceneSuitability.source,
          } } : {}),
          ...(composition ? { composition: {
            version: COMPOSITION_INTELLIGENCE_VERSION,
            framing: composition.framing,
            productDominance: composition.productDominance,
            source: composition.source,
          } } : {}),
          creative_compliance: {
            version: CREATIVE_DIRECTION_COMPLIANCE_VERSION,
            totalRequirements: creativeCompliance.requirements.length,
            appliedCount: creativeCompliance.applied.length,
            rejectedCount: creativeCompliance.rejected.length,
          },
          ...(productProfile ? { product_profile: {
            assetId: asset.id,
            schemaVersion: productProfile.schemaVersion,
            analysisVersion: productProfile.analysisVersion,
            vertical: productProfile.vertical,
            subcategory: productProfile.subcategory,
          } } : {}),
          references: {
            mode: referenceMode,
            requested_count: requestedReferenceAssetIds.length,
            usable_count: referenceAnalysis.usableCount,
            asset_ids: requestedReferenceAssetIds,
            analysis: {
              enabled: requestedReferenceAssetIds.length > 0,
              succeeded: referenceAnalysis.styleBrief !== null,
              model: requestedReferenceAssetIds.length > 0 ? getReferenceAnalysisModel() : null,
              version: REFERENCE_ANALYSIS_VERSION,
            },
            ...(referenceMatch ? {
              reference_match: {
                version: REFERENCE_MATCH_VERSION,
                mode: referenceMatch.mode,
                compatible: referenceMatch.compatible,
                primaryReferenceAssetId: requestedReferenceAssetIds[0] ?? null,
                appliedAttributeCategories: [...new Set([
                  referenceMatch.compositionAdjustments.length ? "composition" : "",
                  referenceMatch.interactionAdjustments.length ? "interaction" : "",
                  referenceMatch.styleAdjustments.length ? "style" : "",
                ].filter(Boolean))],
              },
            } : {}),
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
    safeGenerationEvent("queue", "processor_exit", { generationId, status: "succeeded" });

    return { ok: true };
  } catch (error) {
    if (providerDiagnosticContext) {
      safeGenerationEvent("queue", "provider_error", { generationId, provider: providerDiagnosticContext.provider, model: providerDiagnosticContext.model });
      console.error("[generation] provider_error", getSafeProviderErrorDiagnostics(error, {
        generationId, ...providerDiagnosticContext,
      }));
    }
    logDevelopmentGenerationEvent("failed", { generationId });
    if (processingStartedAt) {
      await markGenerationFailed(generationId, processingStartedAt);
    }
    safeGenerationEvent("queue", "processor_exit", { generationId, status: "failed" });

    return { ok: false, message: "generationFailed" };
  }
}
