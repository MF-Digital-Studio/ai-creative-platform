import "server-only";
import { extractArtworkLayer } from "./artwork-layer";
import { detectGarmentSurface, resolveGarmentLandmarks } from "./garment-surface";
import { APPAREL_PROJECTION_VERSION, resolveProjectionAppliedState, validBox, type Box, type ProjectionMetadata } from "./types";
import { resolveTargetSurfaceReadiness } from "./resolve-target-readiness";

async function getSharp() {
  try {
    const sharpModule = await import("sharp");
    return sharpModule.default;
  } catch (cause) {
    throw new SharpRuntimeUnavailableError({ cause });
  }
}

export class SharpRuntimeUnavailableError extends Error {
  constructor(options?: ErrorOptions) {
    super("Sharp runtime is unavailable.", options);
    this.name = "SharpRuntimeUnavailableError";
  }
}

async function logSharpRuntime(): Promise<void> {
  const sharp = await getSharp();
  try {
    console.info("[hybrid-projection:sharp-runtime]", {
      sharpVersion: sharp.versions?.sharp ?? null,
      vipsVersion: sharp.versions?.vips ?? null,
      platform: process.platform,
      architecture: process.arch,
    });
  } catch (error) {
    const diagnosticError = error as NodeJS.ErrnoException;
    console.warn("[hybrid-projection:sharp-diagnostic-failed]", {
      errorName: diagnosticError.name,
      errorCode: diagnosticError.code ?? null,
    });
  }
}

export function shouldUseHybridProjection(input: { vertical: string | null; artworkPresent: boolean; identityCritical: boolean; side: string; subject: string; localized: boolean }): boolean {
  return input.vertical === "apparel" && input.artworkPresent && input.identityCritical && input.localized && ["front", "back"].includes(input.side) && input.subject === "fashion_on_model";
}

export function sourceArtworkAnchors(artwork: Box, garment: Box): Box | null {
  if (!validBox(artwork) || !validBox(garment)) return null;
  const relative = { x: (artwork.x - garment.x) / garment.width, y: (artwork.y - garment.y) / garment.height, width: artwork.width / garment.width, height: artwork.height / garment.height };
  return validBox(relative) && relative.width < .9 && relative.height < .85 ? relative : null;
}

export function planArtworkPlacement(anchors: Box, target: Box): Box | null {
  const box = { x: target.x + anchors.x * target.width, y: target.y + anchors.y * target.height, width: anchors.width * target.width, height: anchors.height * target.height };
  const safe = resolveGarmentLandmarks(target)?.printSafeRectangle;
  if (!validBox(box) || !safe || box.x < safe.x - .04 * target.width || box.y < safe.y - .04 * target.height || box.x + box.width > safe.x + safe.width + .04 * target.width || box.y + box.height > safe.y + safe.height + .04 * target.height) return null;
  return box;
}

export async function projectApparelArtwork(input: { sourceImage: Buffer; artworkCrop: Buffer; artworkBox: Box; generatedImage: Buffer; side: "front" | "back"; generationId: string; targetSurfaceReady?: boolean; log: (event: string, fields: Record<string, string | number | boolean>) => void }): Promise<{ image: Buffer; metadata: ProjectionMetadata }> {
  const metadata: ProjectionMetadata = { version: APPAREL_PROJECTION_VERSION, enabled: true, applied: false, fallbackReason: null, artworkExtractionMode: "unavailable", garmentSurfaceConfidence: 0, warpMode: "unavailable", finishingPassApplied: false, validationStatus: "not_applied", repairAttempted: false };
  try {
    if (!resolveTargetSurfaceReadiness({ targetLandmarksAvailable: input.targetSurfaceReady !== false, minimumConfidence: .75, confidence: input.targetSurfaceReady === false ? 0 : 1 }).ready) { metadata.fallbackReason = "target_surface_unavailable"; return { image: input.generatedImage, metadata }; }
    const sharp = await getSharp();
    await logSharpRuntime();
    const layer = await extractArtworkLayer(input.artworkCrop, input.artworkBox);
    metadata.artworkExtractionMode = layer?.extractionMode ?? "unavailable";
    if (!layer || layer.confidence < .6) { metadata.fallbackReason = "artwork_extraction_low_confidence"; return { image: input.generatedImage, metadata }; }
    const target = await detectGarmentSurface(input.generatedImage, input.side);
    metadata.garmentSurfaceConfidence = target?.confidence ?? 0;
    input.log("apparel_projection_resolved", { generationId: input.generationId, eligible: true, applied: false, fallbackReason: "awaiting_composite", artworkConfidence: layer.confidence, garmentConfidence: target?.confidence ?? 0 });
    const targetReadiness = resolveTargetSurfaceReadiness({ targetLandmarksAvailable: Boolean(target && resolveGarmentLandmarks(target.normalizedBoundingBox)), minimumConfidence: .75, confidence: target?.confidence ?? 0 });
    if (!targetReadiness.ready) { metadata.fallbackReason = targetReadiness.fallbackReason; input.log("apparel_projection_landmarks", { generationId: input.generationId, sourceLandmarksAvailable: false, targetLandmarksAvailable: false }); return { image: input.generatedImage, metadata }; }
    const source = await detectGarmentSurface(input.sourceImage, input.side);
    input.log("apparel_projection_landmarks", { generationId: input.generationId, sourceLandmarksAvailable: Boolean(source), targetLandmarksAvailable: true });
    if (!source || !resolveGarmentLandmarks(source.normalizedBoundingBox) || !target || !resolveGarmentLandmarks(target.normalizedBoundingBox)) { metadata.fallbackReason = "garment_surface_unavailable"; return { image: input.generatedImage, metadata }; }
    const anchors = sourceArtworkAnchors(input.artworkBox, source.normalizedBoundingBox);
    const placement = anchors && planArtworkPlacement(anchors, target.normalizedBoundingBox);
    if (!placement) { metadata.fallbackReason = "placement_unavailable"; return { image: input.generatedImage, metadata }; }
    const imageInfo = await sharp(input.generatedImage).metadata();
    if (!imageInfo.width || !imageInfo.height) { metadata.fallbackReason = "image_dimensions_unavailable"; return { image: input.generatedImage, metadata }; }
    const left = Math.round(placement.x * imageInfo.width), top = Math.round(placement.y * imageInfo.height);
    const width = Math.max(1, Math.round(placement.width * imageInfo.width)), height = Math.max(1, Math.round(placement.height * imageInfo.height));
    if (left < 0 || top < 0 || left + width > imageInfo.width || top + height > imageInfo.height) { metadata.fallbackReason = "projection_out_of_bounds"; return { image: input.generatedImage, metadata }; }
    const projected = await sharp(layer.rgbaImage).resize(width, height, { fit: "fill", kernel: "lanczos3" }).png().toBuffer();
    // Use local garment luminance for subtle shading while retaining source hue and crisp alpha.
    const garment = await sharp(input.generatedImage).extract({ left, top, width, height }).removeAlpha().raw().toBuffer();
    const { data: print } = await sharp(projected).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
    let mean = 0;
    for (let i = 0; i < garment.length; i += 3) mean += (garment[i] + garment[i + 1] + garment[i + 2]) / 3;
    mean /= width * height;
    for (let i = 0; i < width * height; i++) {
      const j = i * 3, k = i * 4;
      const luminance = (garment[j] + garment[j + 1] + garment[j + 2]) / 3;
      const shading = Math.max(.82, Math.min(1.12, 1 + (luminance - mean) / 600));
      for (let channel = 0; channel < 3; channel++) print[k + channel] = Math.min(255, Math.round(print[k + channel] * shading));
    }
    const overlay = await sharp(print, { raw: { width, height, channels: 4 } }).png().toBuffer();
    const image = await sharp(input.generatedImage).composite([{ input: overlay, left, top }]).png().toBuffer();
    metadata.applied = resolveProjectionAppliedState({ enabled: metadata.enabled, compositeSucceeded: true }); metadata.warpMode = "affine";
    input.log("apparel_projection_composite", { generationId: input.generationId, success: true, warpMode: "affine" });
    input.log("apparel_projection_validation", { generationId: input.generationId, status: metadata.validationStatus, issueCodes: "" });
    input.log("apparel_projection_resolved", { generationId: input.generationId, eligible: true, applied: true, fallbackReason: "" });
    return { image, metadata };
  } catch {
    metadata.fallbackReason = "projection_failed";
    input.log("apparel_projection_composite", { generationId: input.generationId, success: false, warpMode: "unavailable" });
    input.log("apparel_projection_validation", { generationId: input.generationId, status: "unavailable", issueCodes: "" });
    return { image: input.generatedImage, metadata };
  }
}
