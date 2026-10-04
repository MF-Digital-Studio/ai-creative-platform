import type { GenerationStrategy } from "../strategy/generation-strategy";

export const REFERENCE_PRODUCT_REPLACEMENT_VERSION = "reference-product-replacement-v1" as const;

export function resolveReferenceGenerationPath(input: {
  compatibleReferenceCount: number;
  referenceCompatible: boolean;
  fallbackStrategy: GenerationStrategy;
}): { strategy: "reference_product_replacement" | GenerationStrategy } {
  if (input.compatibleReferenceCount > 0 && input.referenceCompatible) {
    return { strategy: "reference_product_replacement" };
  }
  return { strategy: input.fallbackStrategy };
}
