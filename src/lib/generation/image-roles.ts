import type { GenerationImageInput, ImageGenerationSourceAsset } from "./types";

export const IMAGE_ORDERING_VERSION = "generation-image-order-v1" as const;

export type { GenerationImageInput, GenerationImageRole } from "./types";

export function orderGenerationImages(
  product: ImageGenerationSourceAsset,
  references: readonly ImageGenerationSourceAsset[] = [],
  artwork?: ImageGenerationSourceAsset | null,
): GenerationImageInput[] {
  return [
    { ...product, role: "product_identity_source", order: 0 },
    ...(artwork ? [{ ...artwork, role: "apparel_artwork_identity_source" as const, order: 1 }] : []),
    ...references.slice(0, artwork ? 2 : 3).map((reference, index) => ({
      ...reference,
      role: index === 0 ? "scene_reference" as const : "style_reference" as const,
      order: index + (artwork ? 2 : 1),
      referenceRole: index === 0 ? "primary" as const : "supporting" as const,
    })),
  ];
}

/** OpenAI edit requests place the base photograph first, followed by the identity source. */
export function orderReferenceReplacementImages(
  baseScene: ImageGenerationSourceAsset,
  product: ImageGenerationSourceAsset,
): GenerationImageInput[] {
  return [
    { ...baseScene, role: "reference_base_scene", order: 0, referenceRole: "primary" as const },
    { ...product, role: "product_identity_source", order: 1 },
  ];
}

export function orderImageEditImages(baseImage: ImageGenerationSourceAsset, product: ImageGenerationSourceAsset): GenerationImageInput[] {
  return [
    { ...baseImage, role: "generated_attempt", order: 0 },
    { ...product, role: "product_identity_source", order: 1 },
  ];
}

export function buildReferenceReplacementPrompt(userDirection: string): string {
  return [
    "REFERENCE IMAGE — PRESERVE AS BASE PHOTOGRAPH. Image 1 is the photograph to edit. Preserve its composition, subject, pose, anatomy, framing, camera, perspective, lighting, shadows, skin, clothing, background, environment, depth of field, and photographic character. Do not recreate or redesign the scene. Modify only the smallest region needed for the product.",
    "SOURCE PRODUCT — EXACT IDENTITY. Image 2 is the sole authority for product identity. Match its geometry, silhouette, material, color, stones, setting, band, dial, packaging, panels, logos, artwork, and identity-critical details. Reference product identity must never override it.",
    "REPLACE the existing product of the same category; remove it and insert the source product. If no product is present, place the source product naturally in the appropriate target region. Do not combine products, invent a third product, or alter unrelated areas.",
    "Allow only physical integration changes: perspective, scale, rotation, contact shadow, lighting adaptation, partial occlusion, and natural wrap/contact. These must not redesign the product.",
    `Apply this user direction only when it does not conflict with preservation or product identity: ${userDirection}`,
  ].join("\n\n");
}

export function compileImageRoleInstructions(images: readonly GenerationImageInput[]): string {
  const artworkIndex = images.findIndex(({ role }) => role === "apparel_artwork_identity_source");
  const referenceCount = images.filter(({ role }) => role === "scene_reference" || role === "style_reference").length;
  return [
    "INPUT IMAGE ROLES — STRICT AUTHORITY ORDER:",
    "Image 1 is PRODUCT IDENTITY SOURCE and is the exact product design authority.",
    artworkIndex >= 0 ? `Image ${artworkIndex + 1} is APPAREL ARTWORK IDENTITY SOURCE, a direct pixel crop from the source garment. It independently governs exact print design and typography.` : "No separate apparel artwork crop is available.",
    referenceCount
      ? `Reference roles are determined by upload order: the first scene/style reference is PRIMARY and governs scene, environment structure, subject pose, camera angle, framing, crop intent, composition, subject placement, and visual balance. Match that structure as closely as practical, adapting intelligently to the requested output aspect ratio. Later references are SUPPORTING and may guide lighting, mood, color, styling, atmosphere, and secondary environmental texture only; they cannot override or blend away the primary pose, framing, camera, or layout. Apply explicit user requests only to the specific attribute they name while preserving other primary composition attributes. Never transfer reference product identity, artwork, typography, print color, placement, geometry, materials, branding, stones, watch dials, shoe structure, or packaging.`
      : "No scene or style reference image is supplied.",
    "Replace any reference product with the exact product shown in Image 1.",
  ].join("\n");
}
