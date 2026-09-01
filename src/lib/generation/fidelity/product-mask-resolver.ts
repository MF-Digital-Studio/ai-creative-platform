import sharp from "sharp";
import { resolveAlphaChannelProductMask } from "./pixel-lock";
import type { ProductMask } from "./types";
import type { ProductSegmentationProvider } from "../segmentation/types";

export const segmentationCacheIdentity = { provider: "fal", model: "fal-ai/birefnet/v2", pipelineVersion: 1 } as const;
export type ProductMaskCache = { find(): Promise<Buffer | null>; save(mask: Buffer): Promise<void> };
export type ProductMaskFailureReason =
  | "empty_mask"
  | "full_frame_mask"
  | "invalid_image"
  | "automatic_segmentation_disabled"
  | "segmentation_provider_unavailable";
export type ProductMaskResolution = {
  mask: ProductMask | null;
  source: "alpha_channel" | "cached" | "automatic" | null;
  cached: boolean;
  failureReason: ProductMaskFailureReason | null;
};

export function isAutomaticSegmentationEnabled() {
  return process.env.ENABLE_AUTOMATIC_SEGMENTATION === "true";
}

async function normalizeAndValidate(mask: Buffer, width: number, height: number): Promise<ProductMask | null> {
  try {
    const raw = await sharp(mask, { limitInputPixels: 24_000_000 }).greyscale().resize(width, height, { fit: "fill" }).raw().toBuffer();
    let foreground = 0;
    for (const value of raw) foreground += value > 0 ? 1 : 0;
    const coverage = foreground / raw.length;
    if (coverage <= 0.001 || coverage >= 0.999) return null;
    return { data: await sharp(raw, { raw: { width, height, channels: 1 } }).png().toBuffer(), mimeType: "image/png", width, height, source: "asset" };
  } catch { return null; }
}

export async function resolveProductMask(input: { sourceImage: Buffer; segmentationProvider: ProductSegmentationProvider; cache: ProductMaskCache; mimeType: string }): Promise<ProductMaskResolution> {
  const alpha = await resolveAlphaChannelProductMask(input.sourceImage);
  if (alpha) return { mask: alpha, source: "alpha_channel", cached: false, failureReason: null };
  const meta = await sharp(input.sourceImage).metadata();
  if (!meta.width || !meta.height) return { mask: null, source: null, cached: false, failureReason: "invalid_image" };
  const cached = await input.cache.find();
  if (cached) {
    const mask = await normalizeAndValidate(cached, meta.width, meta.height);
    if (mask) return { mask, source: "cached", cached: true, failureReason: null };
  }
  if (!isAutomaticSegmentationEnabled()) {
    return {
      mask: null,
      source: null,
      cached: false,
      failureReason: "automatic_segmentation_disabled",
    };
  }
  try {
    const bytes = new Uint8Array(input.sourceImage.byteLength);
    bytes.set(input.sourceImage);
    const result = await input.segmentationProvider.createMask({ image: new Blob([bytes], { type: input.mimeType }), mimeType: input.mimeType, operatingResolution: Math.max(meta.width, meta.height) <= 1500 ? "1024x1024" : "2048x2048" });
    const mask = await normalizeAndValidate(result.mask, meta.width, meta.height);
    if (!mask) return { mask: null, source: null, cached: false, failureReason: "empty_mask" };
    await input.cache.save(mask.data);
    return { mask, source: "automatic", cached: false, failureReason: null };
  } catch { return { mask: null, source: null, cached: false, failureReason: "segmentation_provider_unavailable" }; }
}
