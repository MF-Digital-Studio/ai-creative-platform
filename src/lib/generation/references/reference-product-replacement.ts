import type { GenerationStrategy } from "../strategy/generation-strategy";

export const REFERENCE_PRODUCT_REPLACEMENT_VERSION = "reference-product-replacement-v1" as const;

export function resolveReferenceGenerationPath(input: {
  compatibleReferenceCount: number;
  referenceCompatible: boolean;
  fallbackStrategy: GenerationStrategy;
  fallbackUsesStageA: boolean;
}): { strategy: "reference_product_replacement" | GenerationStrategy; usesStageA: boolean } {
  if (input.compatibleReferenceCount > 0 && input.referenceCompatible) {
    return { strategy: "reference_product_replacement", usesStageA: false };
  }
  return { strategy: input.fallbackStrategy, usesStageA: input.fallbackUsesStageA };
}
