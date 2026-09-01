export const creativePresetCategories = ["fashion", "jewelry", "product"] as const;

export type CreativePresetCategory = (typeof creativePresetCategories)[number];

export type CreativePreset = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: CreativePresetCategory;
  generationMode: "image";
  useCase: CreativePresetCategory;
  thumbnail: string;
  objectPosition?: string;
  promptSeed: string;
  recommendedTags?: readonly string[];
  sortOrder: number;
  enabled: boolean;
};

const imagePresets = [
  ["on-model-editorial", "On-model Editorial", "Clean premium fashion editorial photograph.", "fashion", "/features/templates/fashion-template.webp", "premium fashion editorial; realistic on-model styling; natural fabric behavior; balanced modern composition; apparel remains the hero"],
  ["brutalist-streetwear", "Brutalist Streetwear", "Streetwear campaign with modern architectural mood.", "fashion", "/workspace-demo/fashion/campaign.webp", "premium streetwear editorial; brutalist architecture; natural modern fashion photography; realistic model pose; apparel remains the hero; sophisticated urban composition"],
  ["urban-night", "Urban Night", "Cinematic night streetwear campaign.", "fashion", "/workspace-demo/fashion/social.webp", "cinematic urban night campaign; premium streetwear; controlled city reflections; grounded night lighting; confident editorial mood; apparel remains the hero"],
  ["minimal-studio-fashion", "Minimal Studio Fashion", "Soft studio setup for clean apparel presentation.", "fashion", "/workspace-demo/fashion/product.webp", "minimal premium fashion studio; soft neutral tones; clean apparel presentation; realistic fabric detail; refined commercial lighting; balanced composition"],
  ["back-print-focus", "Back Print Focus", "Designed for back-graphic apparel campaigns.", "fashion", "/workspace-demo/fashion/fabric-detail.webp", "back-facing apparel campaign; back graphic clearly visible; realistic garment drape; editorial model pose; clean modern setting; apparel remains the hero"],
  ["front-hero-apparel", "Front Hero Apparel", "Front-facing garment-focused model shot.", "fashion", "/auth/fashion-dress-campaign.webp", "front-facing fashion hero; garment silhouette and front design in focus; realistic on-model styling; clean premium campaign lighting; confident natural pose"],
  ["luxury-macro-jewelry", "Luxury Macro", "Close-up luxury jewelry campaign with rich detail.", "jewelry", "/workspace-demo/jewelry/macro.webp", "luxury jewelry macro; precise material detail; refined highlights; shallow depth of field; premium campaign photography; jewelry remains the hero"],
  ["soft-daylight-jewelry", "Soft Daylight Jewelry", "Elegant jewelry photography in soft natural light.", "jewelry", "/workspace-demo/jewelry/product.webp", "soft natural daylight; elegant jewelry photography; gentle shadows; clean premium styling; realistic metal and stone detail; refined composition"],
  ["black-luxury-jewelry", "Black Luxury", "Dark premium jewelry campaign with dramatic lighting.", "jewelry", "/workspace-demo/jewelry/campaign.webp", "dark luxury jewelry campaign; deep black backdrop; dramatic refined lighting; controlled gold reflections; rich detail; jewelry remains the hero"],
  ["jewelry-on-model", "Jewelry on Model", "Elegant on-model jewelry editorial image.", "jewelry", "/workspace-demo/jewelry/campaign-hero.webp", "elegant on-model jewelry editorial; natural skin tone; jewelry and wardrobe in harmony; refined portrait lighting; realistic premium photography"],
  ["stone-surface-jewelry", "Stone Surface", "Jewelry styled on elegant stone or marble surfaces.", "jewelry", "/features/templates/jewelry-template.webp", "premium jewelry still life; elegant stone or marble surface; sculptural composition; controlled highlights; realistic material detail; quiet luxury mood"],
  ["minimal-product-detail", "Minimal Detail", "Clean and minimal close-up product presentation.", "jewelry", "/workspace-demo/jewelry/social.webp", "minimal jewelry close-up; distraction-free backdrop; precise product detail; clean soft lighting; premium commercial photography; jewelry remains the focus"],
  ["dark-premium-studio", "Dark Premium Studio", "High-end studio product campaign with dark premium mood.", "product", "/features/templates/cosmetics-template.webp", "dark premium product studio; controlled directional lighting; refined shadows; high-end hero product composition; realistic commercial photography"],
  ["soft-daylight-product", "Soft Daylight Product", "Bright natural commercial product photography.", "product", "/workspace-demo/cosmetics/product.webp", "bright natural commercial product photography; soft daylight; clean surface; grounded shadows; fresh premium composition; product remains the hero"],
  ["tabletop-lifestyle", "Tabletop Lifestyle", "Styled product placed naturally in a tasteful setting.", "product", "/workspace-demo/cosmetics/campaign.webp", "tasteful tabletop lifestyle scene; warm lived-in setting; natural product placement; soft directional daylight; polished commercial photography"],
  ["reflective-luxury-surface", "Reflective Luxury", "Elegant luxury product scene with controlled reflections.", "product", "/features/image-and-video/campaign-visual.webp", "luxury product scene; elegant reflective surface; controlled highlights; precise reflections; premium hero composition; realistic commercial photography"],
  ["minimal-catalog-plus", "Minimal Commercial", "Clean commercial product shot with premium polish.", "product", "/features/product-fidelity/generated-scene.webp", "clean premium commercial product shot; minimal backdrop; polished lighting; accurate product detail; modern composition; elevated catalog aesthetic"],
  ["tech-launch-hero", "Tech Launch Hero", "Flagship technology campaign image with refined drama.", "product", "/features/image-and-video/vertical-social.webp", "flagship technology campaign; futuristic premium studio; product hero shot; refined dramatic lighting; launch-event energy; realistic commercial photography"],
] as const;

export const creativePresets: readonly CreativePreset[] = imagePresets.map(
  ([id, title, shortDescription, category, thumbnail, promptSeed], index) => ({
    id,
    slug: id,
    title,
    shortDescription,
    category,
    generationMode: "image",
    useCase: category,
    thumbnail,
    promptSeed,
    sortOrder: index + 1,
    enabled: true,
  }),
);

export function getCreativePreset(id: unknown): CreativePreset | null {
  if (typeof id !== "string") {
    return null;
  }

  return creativePresets.find((preset) => preset.enabled && preset.id === id) ?? null;
}
