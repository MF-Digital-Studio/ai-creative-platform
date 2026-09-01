export type GenerationVisualCategory = "fashion" | "jewelry" | "cosmetics" | "product";
export type VisualIntent = "artistic" | "photographic";

export type ImageGenerationContext = {
  category: GenerationVisualCategory;
  visualIntent: VisualIntent;
};

const artisticIntentPattern = /\b(illustration|anime|manga|painting|watercolou?r|oil paint|3d styl(?:e|ized|isation|ization)|3d render|graphic poster|vector art|surreal art|surrealism|collage)\b/i;
const fashionPattern = /\b(fashion|streetwear|apparel|garment|hoodie|t-?shirt|sweatshirt|jacket|dress|trousers|pants|skirt|wearing|outfit)\b/i;
const jewelryPattern = /\b(jewelry|jewellery|ring|necklace|earring|bracelet|pendant|gemstone|gem |diamond)\b/i;
const cosmeticsPattern = /\b(cosmetic|skincare|skin care|serum|moisturi[sz]er|lipstick|makeup|fragrance|perfume|beauty product)\b/i;

export const globalPhotorealismPolicy = [
  "Global photorealism policy: create believable real-world commercial photography with physically plausible lighting, material response, shadows, reflections, natural depth, authentic camera perspective, realistic image texture, and restrained post-processing.",
  "Keep dynamic range and natural imperfections appropriate to the scene; avoid CGI or 3D-render appearance, synthetic glossy or plastic textures, perfect symmetry, artificial HDR, excessive sharpening, fake depth of field, overly smooth surfaces, and generic AI-art aesthetics.",
].join("\n");

export const categoryPhotorealismPolicies: Record<GenerationVisualCategory, string> = {
  fashion: [
    "Fashion realism policy: portray a believable adult with natural anatomy, realistic proportions, credible posture and weight distribution, realistic hands, subtle facial asymmetry, visible skin pores and micro-texture, natural hair strands, and relaxed expression.",
    "Give the garment real weight and natural body contact: natural drape, folds, sleeves, shoulders, waist, hem, textile micro-texture, and print placement must follow the cloth surface. Avoid mannequin bodies, plastic skin, fashion mockup appearance, floating or cardboard-flat clothing, pasted overlays, impossible folds, duplicated body parts, and glossy synthetic fabric.",
  ].join("\n"),
  jewelry: [
    "Jewelry realism policy: use true-to-scale macro or editorial photography with physically believable metal reflections, gemstone refraction and specular detail, precise edges, and natural contact shadows. When worn, show realistic skin contact and hand anatomy.",
    "Avoid floating jewelry, warped reflections, plastic metal, invented stones, duplicated pieces, or CGI product-render appearance.",
  ].join("\n"),
  cosmetics: [
    "Cosmetics realism policy: show believable glass, plastic, metal, liquid, or translucent material response; retain readable label and packaging texture, truthful reflections, and grounded contact shadows in a commercial beauty photograph.",
    "Avoid waxy packaging, floating products, distorted labels, artificial gloss, or CGI-render appearance.",
  ].join("\n"),
  product: [
    "Product realism policy: use accurate material response, plausible surface interaction, realistic contact shadows and reflections, and grounded commercial product photography.",
    "Avoid floating products, plastic textures, impossible reflections, synthetic CGI-render appearance, or altered product geometry.",
  ].join("\n"),
};

export function resolveImageGenerationContext(
  creativeDirection: string,
  useCase?: string | null,
): ImageGenerationContext {
  const direction = creativeDirection.trim();
  const directionWithoutNegativeConstraints = direction
    .split("\n")
    .filter((line) => !/\b(no|avoid|never|not)\b|negative constraints:|realism constraints:/i.test(line))
    .join("\n");
  const visualIntent = artisticIntentPattern.test(directionWithoutNegativeConstraints)
    ? "artistic"
    : "photographic";

  if (useCase === "fashion" || fashionPattern.test(direction)) {
    return { category: "fashion", visualIntent };
  }
  if (useCase === "jewelry" || jewelryPattern.test(direction)) {
    return { category: "jewelry", visualIntent };
  }
  if (cosmeticsPattern.test(direction)) {
    return { category: "cosmetics", visualIntent };
  }

  return { category: "product", visualIntent };
}
