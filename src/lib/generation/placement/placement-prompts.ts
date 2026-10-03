import type { ProductIdentityManifest } from "@/lib/product-identity/types";
import { compilePlacementReferenceDirection, type PlacementReferenceProfile } from "./project-reference-for-placement";
import type { GenerationStrategy } from "../strategy/generation-strategy";

const targetFor = (strategy: GenerationStrategy) => strategy === "jewelry_on_model"
  ? "a clear bare finger segment"
  : strategy === "watch_on_wrist"
    ? "a clear bare wrist segment"
    : "a clear foot and ankle region";

export function buildPlacementStageAPrompt(input: {
  creativeDirection: string;
  strategy: GenerationStrategy;
  referenceProfile?: PlacementReferenceProfile | null;
}): string {
  const placementRequirements = input.strategy === "jewelry_on_model"
    ? "PLACEMENT CANVAS — READINESS FIRST. Create a photorealistic close-up or macro-adjacent hand as the main subject, overriding any wider reference framing. The fourth finger must be clearly visible, large in frame, separated slightly from neighboring fingers, and unobstructed from proximal through middle phalanx. Use a dorsal or slight three-quarter surface with clear lateral edges, natural slight bend only, and no extreme foreshortening, crossed fingers, clenched fist, or hand coverage. Valid anatomy, target visibility, target size, unobstructed placement plane, and natural hand geometry outrank reference pose and framing resemblance. Keep the hand completely free of accessories. No rings. No bracelets. No watches. No gemstones. No hand jewelry. Do not render any product."
    : input.strategy === "watch_on_wrist"
      ? "Create the wrist and scene only. Generate a bare, visible, unobstructed wrist with enough usable case and strap area. Do not generate a watch, bracelet, wrist accessory, or device."
      : "Create the foot, body, and ground scene only. Keep a visible, usable foot and ankle placement region with plausible ground contact. Do not generate a branded, identity-bearing, or competing shoe when replacement is expected.";
  return [
    "STAGE A — SCENE PREPARATION ONLY.",
    `Generate the requested photographic scene, pose, camera, framing, lighting, environment, and ${targetFor(input.strategy)} suitable for a later product placement edit.`,
    "Placement readiness is higher priority than an exact reference pose: preserve the general pose, camera, mood, lighting, and environment, but adjust spacing, angle, or crop when needed to expose the target region.",
    placementRequirements,
    "Do not generate, describe, recreate, infer, or substitute the final product identity. Prefer a bare target region; no placeholder product is required.",
    "Raw reference and source-product pixels are intentionally absent from this stage. Apply only the sanitized body, camera, lighting, and environment direction below.",
    compilePlacementReferenceDirection(input.referenceProfile ?? null),
  ].join("\n\n");
}

export function buildPlacementStageBPrompt(input: {
  creativeDirection: string;
  strategy: GenerationStrategy;
  identityManifest: ProductIdentityManifest;
}): string {
  const specific = input.strategy === "jewelry_on_model"
    ? "For a ring: retain the same center stone, setting, side-stone structure, band geometry, decorative details, metal, and silhouette. Align its plane to the finger and create credible near/far band occlusion, contact shadow, and wrap; never make it a flat sticker."
    : input.strategy === "watch_on_wrist"
      ? "For a watch: retain the exact dial, case, crown, bezel, bracelet or strap and their geometry. Adapt only perspective, wrist curvature, contact, and lighting."
      : "For footwear: retain the exact silhouette, panels, sole, lacing, and color blocking. Adapt only perspective, foot pose, ground contact, and lighting; do not reshape it into another shoe.";
  return [
    "STAGE B — IDENTITY PLACEMENT EDIT.",
    "Image 1 is the prepared scene. Image 2 is the ORIGINAL SOURCE PRODUCT and is the highest authority.",
    "Insert the exact uploaded source product into the prepared target region. Preserve its visible design exactly; do not invent, redesign, simplify, or substitute a similar product.",
    "Only adapt perspective, scale, lighting, occlusion, and physical contact required for a believable placement. The scene must adapt to the product where they conflict.",
    specific,
    `Product identity manifest is an interpretation aid subordinate to source pixels: ${JSON.stringify(input.identityManifest)}.`,
    `Creative direction controls scene styling only: ${input.creativeDirection}`,
  ].join("\n\n");
}
