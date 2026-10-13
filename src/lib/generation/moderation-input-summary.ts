import type { GenerationImageInput } from "./types";

export type ModerationInputSummary = {
  productImageCount: number;
  referenceImageCount: number;
  humanReferenceDetected: boolean;
  commercialSafetyApplied: boolean;
  finalNormalizerAppliedAfterAllFragments: true;
  referenceFreeTextIncluded: boolean;
};

/** Metadata only: never accepts or returns image bytes or prompt text. */
export function createModerationInputSummary(input: {
  images: readonly GenerationImageInput[];
  humanReferenceDetected: boolean;
  commercialSafetyApplied: boolean;
  referenceFreeTextIncluded: boolean;
}): ModerationInputSummary {
  return {
    productImageCount: input.images.filter(({ role }) =>
      role === "product_identity_source" || role === "product_identity_supporting"
    ).length,
    referenceImageCount: input.images.filter(({ role }) =>
      role === "reference_base_scene" || role === "scene_reference" || role === "style_reference"
    ).length,
    humanReferenceDetected: input.humanReferenceDetected,
    commercialSafetyApplied: input.commercialSafetyApplied,
    finalNormalizerAppliedAfterAllFragments: true,
    referenceFreeTextIncluded: input.referenceFreeTextIncluded,
  };
}
