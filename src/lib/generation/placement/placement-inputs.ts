import type { GenerationImageInput, ImageGenerationSourceAsset } from "../types";

/** Stage A is text-driven so reference pixels cannot recreate a competing product. */
export function buildProductFreePlacementStageAInputs(): GenerationImageInput[] {
  return [];
}

/** Stage B receives only the prepared canvas and authoritative source product. */
export function buildPlacementStageBInputs(
  preparedScene: ImageGenerationSourceAsset,
  productIdentity: ImageGenerationSourceAsset,
): GenerationImageInput[] {
  return [
    { ...preparedScene, role: "generated_attempt", order: 0 },
    { ...productIdentity, role: "product_identity_source", order: 1 },
  ];
}
