import type { GenerationImageInput, ImageGenerationSourceAsset } from "./types";

export const IMAGE_ORDERING_VERSION = "generation-image-order-v1" as const;

export type { GenerationImageInput, GenerationImageRole } from "./types";

export function orderGenerationImages(
  product: ImageGenerationSourceAsset | readonly ImageGenerationSourceAsset[],
  references: readonly ImageGenerationSourceAsset[] = [],
  artwork?: ImageGenerationSourceAsset | null,
): GenerationImageInput[] {
  const products = Array.isArray(product) ? product : [product];
  return [
    ...products.map((source, index) => ({ ...source, role: index === 0 ? "product_identity_source" as const : "product_identity_supporting" as const, order: index })),
    ...(artwork ? [{ ...artwork, role: "apparel_artwork_identity_source" as const, order: products.length }] : []),
    ...references.slice(0, artwork ? 2 : 3).map((reference, index) => ({
      ...reference,
      role: index === 0 ? "scene_reference" as const : "style_reference" as const,
      order: index + products.length + (artwork ? 1 : 0),
      referenceRole: index === 0 ? "primary" as const : "supporting" as const,
    })),
  ];
}

/** OpenAI edit requests place the base photograph first, followed by the identity source. */
export function orderReferenceReplacementImages(
  baseScene: ImageGenerationSourceAsset,
  product: ImageGenerationSourceAsset | readonly ImageGenerationSourceAsset[],
): GenerationImageInput[] {
  const products = Array.isArray(product) ? product : [product];
  return [
    { ...baseScene, role: "reference_base_scene", order: 0, referenceRole: "primary" as const },
    ...products.map((source, index) => ({ ...source, role: index === 0 ? "product_identity_source" as const : "product_identity_supporting" as const, order: index + 1 })),
  ];
}

export function orderImageEditImages(baseImage: ImageGenerationSourceAsset, product: ImageGenerationSourceAsset | readonly ImageGenerationSourceAsset[]): GenerationImageInput[] {
  const products = Array.isArray(product) ? product : [product];
  return [
    { ...baseImage, role: "generated_attempt", order: 0 },
    ...products.map((source, index) => ({ ...source, role: index === 0 ? "product_identity_source" as const : "product_identity_supporting" as const, order: index + 1 })),
  ];
}

export function buildReferenceReplacementPrompt(userDirection: string): string {
  return [
    "REFERENCE IMAGE — PRESERVE AS BASE PHOTOGRAPH. Image 1 is the photograph to edit. Preserve its composition, subject, pose, anatomy, framing, camera, perspective, lighting, shadows, skin, clothing, background, environment, depth of field, and photographic character. Do not recreate or redesign the scene. Modify only the smallest region needed for the product.",
    "SOURCE PRODUCT — EXACT IDENTITY, MULTI-VIEW EVIDENCE. The product identity images after Image 1 show the same physical product from different viewpoints and are collectively the sole authority for product identity. Treat them as identity evidence for one single product. The first product image is primary authority for silhouette, main color, overall form, and composition; later product images are supporting authority for rear/side views, hardware, texture, pattern, logo, sole, bag handles, straps, closure, zippers, and visible construction. Do not interpret them as separate products and do not generate multiple products. Reference product identity must never override it; here, it means the collective product identity set.",
    "REPLACE the existing product of the same category; remove it and insert the source product. If no product is present, place the source product naturally in the appropriate target region. Do not combine products, invent a third product, or alter unrelated areas.",
    "Allow only physical integration changes: perspective, scale, rotation, contact shadow, lighting adaptation, partial occlusion, and natural wrap/contact. These must not redesign the product.",
    `Apply this user direction only when it does not conflict with preservation or product identity: ${userDirection}`,
  ].join("\n\n");
}

export function compileImageRoleInstructions(images: readonly GenerationImageInput[]): string {
  const artworkIndex = images.findIndex(({ role }) => role === "apparel_artwork_identity_source");
  const productImages = images.filter(({ role }) => role === "product_identity_source" || role === "product_identity_supporting");
  const primaryProductIndex = images.findIndex(({ role }) => role === "product_identity_source");
  const referenceCount = images.filter(({ role }) => role === "scene_reference" || role === "style_reference").length;
  return [
    "INPUT IMAGE ROLES — STRICT AUTHORITY ORDER:",
    `Image ${primaryProductIndex + 1} is PRIMARY PRODUCT IDENTITY SOURCE. It governs the main silhouette, main color, overall form, proportions, and product composition authority.`,
    productImages.length > 1
      ? `The ${productImages.length - 1} later PRODUCT IDENTITY SUPPORTING images show the same physical product from different viewpoints. Treat all product images collectively as identity evidence for one single product. Supporting views govern visible rear/side geometry, hardware, material, texture, pattern, branding placement, sole, handle/strap, zipper, and construction details. Do not interpret them as separate products, do not blend different SKUs, and do not generate multiple products.`
      : "Only one product identity image is supplied.",
    artworkIndex >= 0 ? `Image ${artworkIndex + 1} is APPAREL ARTWORK IDENTITY SOURCE, a direct pixel crop from the source garment. It independently governs exact print design and typography.` : "No separate apparel artwork crop is available.",
    referenceCount
      ? `Reference roles are determined by upload order: the first scene/style reference is PRIMARY and governs scene, environment structure, subject pose, camera angle, framing, crop intent, composition, subject placement, and visual balance. Match that structure as closely as practical, adapting intelligently to the requested output aspect ratio. Later references are SUPPORTING and may guide lighting, mood, color, styling, atmosphere, and secondary environmental texture only; they cannot override or blend away the primary pose, framing, camera, or layout. Apply explicit user requests only to the specific attribute they name while preserving other primary composition attributes. Never transfer reference product identity, artwork, typography, print color, placement, geometry, materials, branding, stones, watch dials, bag silhouette, handles, straps, hardware, closure, logo, or shoe structure or packaging.`
      : "No scene or style reference image is supplied.",
    "Replace any reference product with the one exact physical product shown collectively by the product identity images.",
  ].join("\n");
}
