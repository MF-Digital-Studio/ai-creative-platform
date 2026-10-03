import type { ImageGenerationQuality } from "../types";

export type ImageModelCapabilities = {
  supportsExplicitInputFidelity: boolean;
  supportsMultiImageEdit: boolean;
  supportsFlexibleSize: boolean;
  supportedQualities: readonly ImageGenerationQuality[];
};

const GPT_IMAGE_2_CAPABILITIES: ImageModelCapabilities = {
  // GPT Image 2 applies high input fidelity by default; the API rejects this field.
  supportsExplicitInputFidelity: false,
  supportsMultiImageEdit: true,
  supportsFlexibleSize: true,
  supportedQualities: ["preview", "standard", "high"],
};

const GPT_IMAGE_1_CAPABILITIES: ImageModelCapabilities = {
  supportsExplicitInputFidelity: true,
  supportsMultiImageEdit: true,
  supportsFlexibleSize: false,
  supportedQualities: ["preview", "standard", "high"],
};

const DEFAULT_CAPABILITIES: ImageModelCapabilities = {
  supportsExplicitInputFidelity: false,
  supportsMultiImageEdit: false,
  supportsFlexibleSize: false,
  supportedQualities: ["standard"],
};

/** Resolves only documented model behavior; unknown model aliases stay conservative. */
export function getImageModelCapabilities(model: string): ImageModelCapabilities {
  const normalizedModel = model.trim().toLowerCase();

  if (normalizedModel === "gpt-image-2" || normalizedModel.startsWith("gpt-image-2-")) {
    return GPT_IMAGE_2_CAPABILITIES;
  }

  if (normalizedModel === "gpt-image-1" || normalizedModel.startsWith("gpt-image-1.5")) {
    return GPT_IMAGE_1_CAPABILITIES;
  }

  return DEFAULT_CAPABILITIES;
}
