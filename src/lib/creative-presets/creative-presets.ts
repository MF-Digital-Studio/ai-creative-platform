import type { CreativeBrief } from "@/lib/generation/prompts/creative-brief";
import { getFashionCaptureProfile, type FashionCaptureProfileId } from "@/lib/generation/prompts/fashion-capture-profiles";
import type { GenerationStrategy } from "@/lib/generation/strategy/generation-strategy";
import { supportedVerticals, type SupportedVertical } from "@/lib/verticals/supported-verticals";

export const creativePresetCategories = supportedVerticals;
export type CreativePresetCategory = SupportedVertical;

export type CreativePreset = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  /** Compatibility alias for existing UI; vertical is the registry source of truth. */
  category: CreativePresetCategory;
  vertical: CreativePresetCategory;
  generationMode: "image";
  generationStrategyHint: GenerationStrategy;
  useCase: CreativePresetCategory;
  thumbnail: string;
  objectPosition?: string;
  creativeDirection: CreativeBrief;
  recommendedTags?: readonly string[];
  sortOrder: number;
  enabled: boolean;
};

type PresetSeed = {
  id: string;
  title: string;
  shortDescription: string;
  vertical: CreativePresetCategory;
  thumbnail: string;
  generationStrategyHint: GenerationStrategy;
  environment: string;
  composition: string;
  camera: string;
  lighting: string;
  mood: string;
  direction: string;
  capture?: FashionCaptureProfileId;
  recommendedTags: readonly string[];
};

type VerticalDefaults = Pick<
  CreativeBrief,
  "subject" | "pose" | "realism" | "productTreatment" | "negativeConstraints"
>;

const verticalDefaults: Record<CreativePresetCategory, VerticalDefaults> = {
  apparel: {
    subject: "One adult fashion model naturally wearing the supplied garment as the clear campaign hero.",
    pose: "Use a relaxed, believable editorial pose with open product-defining panels and no hands obscuring the garment.",
    realism: "Use natural adult anatomy, visible skin and hair texture, credible posture, and fabric weight, drape, folds, seams, and print placement that follow the body.",
    productTreatment: "Preserve the supplied garment's exact silhouette, color, fabric, seams, collar or hood, sleeve structure, logo, print placement, and front or back distinction.",
    negativeConstraints: "No added garments, altered artwork, mirrored print, mannequin stiffness, pasted flat apparel, distorted hands, plastic skin, or CGI finish.",
  },
  jewelry: {
    subject: "One supplied jewelry piece as the sole premium product hero, shown at a truthful and clearly legible scale.",
    pose: "Use a naturally supported placement, or anatomically plausible body contact when the jewelry type is designed to be worn.",
    realism: "Use physically believable metal reflections, restrained gemstone refraction, precise edges, natural contact shadows, and authentic material weight.",
    productTreatment: "Preserve exact geometry, band or chain thickness, stone count and placement, setting structure, metal color, proportions, clasp details, and finish.",
    negativeConstraints: "No floating jewelry, fused metal, malformed fingers, tangled impossible chain, extra stones, duplicate pieces, warped reflections, or chrome CGI.",
  },
  watches: {
    subject: "One supplied watch as a precise, large, commercial hero with its construction and dial clearly readable.",
    pose: "Use a stable supported placement, or a natural wrist fit with believable tension when the watch is worn.",
    realism: "Use accurate dial geometry, marker positions, hands, date window, case proportions, crown, bracelet or strap construction, and physically plausible metal and glass reflections.",
    productTreatment: "Preserve the exact dial layout, bezel, crown side, lugs, bracelet or strap, material, finish, color, and visible branding layout from the supplied watch.",
    negativeConstraints: "No warped dial, nonsense microtext, altered complications, extra crown or pushers, missing links, duplicate watch, floating product, or CGI reflections.",
  },
  cosmetics: {
    subject: "One supplied cosmetic package as the single, immediately recognizable premium beauty campaign hero.",
    pose: "Use an upright or naturally supported product placement that keeps the package, cap or pump, and front label area clearly readable.",
    realism: "Use physically plausible glass, plastic, metal, liquid, or translucent material response, controlled reflections, true label curvature, and grounded contact shadows.",
    productTreatment: "Preserve the exact bottle, jar, or tube geometry; cap, pump, or dropper; label and logo layout; package color; transparency; fill level; and finish.",
    negativeConstraints: "No duplicate packaging, warped cap or pump, altered labels, floating product, fake glass glow, generic clutter, text overlay, or waxy CGI gloss.",
  },
  footwear: {
    subject: "The supplied footwear as the large, unmistakable commercial hero, with construction details remaining visibly coherent.",
    pose: "Use a stable supported placement or a natural foot and ankle fit with credible weight distribution when the footwear is worn.",
    realism: "Use accurate toe box, outsole and midsole geometry, panel alignment, lacing, material texture, natural creasing, and believable floor contact.",
    productTreatment: "Preserve the exact silhouette, sole, heel structure, lacing and eyelets, tongue, logo placement, color blocking, panel layout, and material identity.",
    negativeConstraints: "No shoe too small in frame, floating sole, broken ankles, distorted laces, extra panels or colors, duplicate footwear, flat compositing, or CGI plastic texture.",
  },
};

function createPreset(seed: PresetSeed, sortOrder: number): CreativePreset {
  const defaults = verticalDefaults[seed.vertical];

  return {
    id: seed.id,
    slug: seed.id,
    title: seed.title,
    shortDescription: seed.shortDescription,
    category: seed.vertical,
    vertical: seed.vertical,
    generationMode: "image",
    generationStrategyHint: seed.generationStrategyHint,
    useCase: seed.vertical,
    thumbnail: seed.thumbnail,
    recommendedTags: seed.recommendedTags,
    sortOrder,
    enabled: true,
    creativeDirection: {
      subject: `${defaults.subject} ${seed.direction}`,
      pose: defaults.pose,
      environment: seed.environment,
      composition: seed.composition,
      camera: seed.camera,
      lighting: seed.lighting,
      mood: seed.mood,
      realism: defaults.realism,
      productTreatment: defaults.productTreatment,
      negativeConstraints: defaults.negativeConstraints,
      capture: seed.capture ? getFashionCaptureProfile(seed.capture) : null,
    },
  };
}

const activePresetSeeds = [
  {
    id: "apparel-street-style",
    title: "Street Style",
    shortDescription: "Garment-led editorial streetwear in a real city setting.",
    vertical: "apparel",
    thumbnail: "/presets/apparel-street-style.png",
    generationStrategyHint: "fashion_on_model",
    environment: "A real contemporary city street with restrained concrete or storefront architecture, visible texture, and no distracting crowd.",
    composition: "Garment-led medium-to-full fashion framing with a clear silhouette; the urban context supports rather than competes with the product.",
    camera: "Street-level 35mm to 50mm editorial photography with believable body proportions and true environmental scale.",
    lighting: "Direct on-camera flash or a compact hard key on the model, balanced against darker believable city ambience.",
    mood: "Current, confident, tactile, and premium without becoming cyberpunk or theatrical.",
    direction: "Deliver a streetwear campaign image where the supplied garment is fully legible and commercially convincing.",
    capture: "urban_night_flash",
    recommendedTags: ["city", "streetwear", "editorial"],
  },
  {
    id: "apparel-scenic-editorial",
    title: "Scenic Editorial",
    shortDescription: "Outdoor fashion imagery with a refined landscape supporting the garment.",
    vertical: "apparel",
    thumbnail: "/presets/apparel-scenic-editorial.png",
    generationStrategyHint: "fashion_on_model",
    environment: "A tactile coastal stone, open landscape, or calm natural architecture setting with authentic detail and no fantasy scenery.",
    composition: "Medium-to-full editorial fashion framing gives the location breathing room while keeping the garment large, readable, and central.",
    camera: "Natural 45mm to 55mm location-fashion perspective with grounded distance from the subject.",
    lighting: "Soft directional late-day or overcast daylight that retains true garment color and realistic shadow transitions.",
    mood: "Airy, elevated, tactile, and quietly expressive rather than cinematic or fantastical.",
    direction: "Let the environment add atmosphere while the supplied garment stays the unmistakable hero.",
    capture: "natural_editorial_daylight",
    recommendedTags: ["outdoor", "landscape", "editorial"],
  },
  {
    id: "apparel-studio-style",
    title: "Studio Style",
    shortDescription: "Clean premium studio fashion photography with product clarity.",
    vertical: "apparel",
    thumbnail: "/presets/apparel-studio-style.png",
    generationStrategyHint: "fashion_on_model",
    environment: "A seamless warm-neutral fashion studio with no props or background elements competing with the supplied garment.",
    composition: "A balanced medium or full-body product-led fashion frame with the silhouette, fit, and identity-critical panels easy to inspect.",
    camera: "Natural 50mm studio fashion perspective with clean vertical lines and a credible camera-to-model distance.",
    lighting: "One large soft directional studio source with gentle fill, accurate color, restrained contrast, and a believable floor shadow.",
    mood: "Clear, polished, modern, and premium with a real editorial production character.",
    direction: "Produce clean commercial fashion imagery, not a mannequin render or an e-commerce cutout.",
    capture: "soft_studio_fashion",
    recommendedTags: ["studio", "fashion", "commercial"],
  },
  {
    id: "jewelry-on-body",
    title: "On Body",
    shortDescription: "Close editorial jewelry worn with realistic skin contact and scale.",
    vertical: "jewelry",
    thumbnail: "/presets/jewelry-on-body.png",
    generationStrategyHint: "jewelry_on_model",
    environment: "A quiet premium editorial setting in neutral skin-adjacent tones with no competing wardrobe, props, or additional accessories.",
    composition: "Macro or close body-led framing keeps the jewelry large, sharply readable, and dominant over the surrounding hand, neck, wrist, or ear.",
    camera: "Refined macro editorial photography with truthful scale, natural body perspective, and critical focus on visible craftsmanship.",
    lighting: "Soft sculpted directional light that preserves skin microtexture, contact shadows, metal reflections, and gemstone detail.",
    mood: "Elegant, intimate, controlled, and premium without excessive sparkle or retouching.",
    direction: "Preserve every stone, setting, metal proportion, and distinctive detail. For rings, fit the complete band precisely around a plausible finger with no gaps or skin intersection; for necklaces, follow neck curvature and gravity; for bracelets, show natural wrist contact; for earrings, use real ear attachment points and gravity.",
    recommendedTags: ["hand", "neck", "ear", "editorial"],
  },
  {
    id: "jewelry-studio",
    title: "Studio",
    shortDescription: "Clean luxury jewelry product photography with precise material detail.",
    vertical: "jewelry",
    thumbnail: "/presets/jewelry-studio.png",
    generationStrategyHint: "jewelry_still_life",
    environment: "A seamless warm ivory or restrained neutral studio surface with one subtle support at most and no unrelated decorative objects.",
    composition: "Close product-first framing with the jewelry large, sharply readable, and surrounded by disciplined negative space.",
    camera: "High-resolution macro product photography with true-to-scale perspective and selective optical depth of field.",
    lighting: "Controlled soft studio highlights reveal metal curvature, gemstone detail, and contact shadows without clipping or mirror distortion.",
    mood: "Precise, minimal, polished, and quietly luxurious.",
    direction: "Show the full jewelry form, clasp or setting, and material detail as a single commercial product hero.",
    recommendedTags: ["studio", "macro", "luxury"],
  },
  {
    id: "jewelry-scenic",
    title: "Scenic Setting",
    shortDescription: "Jewelry as a hero product in a refined, tactile natural setting.",
    vertical: "jewelry",
    thumbnail: "/presets/jewelry-scenic.png",
    generationStrategyHint: "jewelry_still_life",
    environment: "A serene limestone, warm stone, or restrained botanical-shadow setting that supports the product without becoming a prop display.",
    composition: "A close sculptural product composition where the jewelry remains large and dominant while the setting provides only calm context.",
    camera: "Close commercial jewelry photography with natural perspective, clear material detail, and a measured shallow depth of field.",
    lighting: "Soft warm directional daylight with controlled highlight rolloff across metal, stone, and gemstones.",
    mood: "Tactile, serene, natural, and high-end.",
    direction: "Keep the full jewelry form and craftsmanship unobstructed; the scenery must never make it small or secondary.",
    recommendedTags: ["stone", "daylight", "scenic"],
  },
  {
    id: "watch-on-wrist",
    title: "On Wrist",
    shortDescription: "A naturally fitted hero watch in a close premium wrist editorial.",
    vertical: "watches",
    thumbnail: "/presets/watch-on-wrist.png",
    generationStrategyHint: "watch_on_wrist",
    environment: "A quiet warm editorial setting with a restrained sleeve edge or subtle material context kept secondary to the watch.",
    composition: "Close wrist-led framing where the watch is large, readable, and visually dominant at believable human scale.",
    camera: "Natural close portrait perspective with crisp focus on the dial and accurate wrist-to-watch proportion.",
    lighting: "Soft warm directional light with controlled crystal and metal reflections, honest skin texture, and restrained highlight edges.",
    mood: "Refined, intimate, precise, and contemporary.",
    direction: "Curve the bracelet or strap naturally around the wrist and keep the dial, crown side, lugs, and case unobstructed.",
    recommendedTags: ["wrist", "editorial", "close-up"],
  },
  {
    id: "watch-bright-studio",
    title: "Bright Studio",
    shortDescription: "A clean bright watch campaign with readable dial and material detail.",
    vertical: "watches",
    thumbnail: "/presets/watch-bright-studio.png",
    generationStrategyHint: "rigid_product",
    environment: "A pale warm-grey seamless studio with one simple support at most and no unrelated luxury props.",
    composition: "A close central product composition with refined negative space and the full watch construction immediately inspectable.",
    camera: "Commercial close product camera with true-to-scale perspective, crisp dial focus, and controlled depth of field.",
    lighting: "Bright sculpted studio lighting with soft fill and carefully shaped reflections on crystal, brushed metal, and polished surfaces.",
    mood: "Clear, technical, premium, and confident.",
    direction: "Keep the dial, bezel, crown, case, and bracelet or strap legible in a premium advertising image.",
    recommendedTags: ["studio", "bright", "product"],
  },
  {
    id: "watch-scenic-environment",
    title: "Scenic Environment",
    shortDescription: "A hero watch campaign with a refined setting that never steals focus.",
    vertical: "watches",
    thumbnail: "/presets/watch-scenic-environment.png",
    generationStrategyHint: "rigid_product",
    environment: "A quiet sunlit stone terrace, refined architectural surface, or tasteful outdoor material context with no distracting objects.",
    composition: "Close sculptural product framing: the environment supplies depth and mood while the watch stays large, sharp, and dominant.",
    camera: "Premium product camera at a natural three-quarter angle with exact perspective and readable mechanical detail.",
    lighting: "Soft late-day directional light with truthful crystal, metal, and shadow behavior; reflections remain controlled rather than theatrical.",
    mood: "Elegant, grounded, composed, and quietly adventurous.",
    direction: "Treat the watch as the only hero product; the setting should express lifestyle without adding visual clutter.",
    recommendedTags: ["lifestyle", "stone", "campaign"],
  },
  {
    id: "footwear-hero-focus",
    title: "Footwear Focus",
    shortDescription: "Close shoe-first framing that keeps construction and silhouette dominant.",
    vertical: "footwear",
    thumbnail: "/presets/footwear-hero-focus.png",
    generationStrategyHint: "rigid_product",
    environment: "A restrained concrete or material-rich floor setting with no model, prop, or background element competing with the shoe.",
    composition: "A very close low-angle product-first frame where the footwear fills the image and stays larger than any surrounding context.",
    camera: "Ground-level commercial footwear photography with true product perspective and crisp focus on construction details.",
    lighting: "Soft directional light with accurate material texture, believable floor contact, and a clear but natural cast shadow.",
    mood: "Bold, tactile, modern, and premium.",
    direction: "Reveal the toe box, upper panels, laces, sole edge, and overall silhouette in a decisive hero crop.",
    recommendedTags: ["close-up", "hero", "construction"],
  },
  {
    id: "footwear-studio",
    title: "Studio",
    shortDescription: "Premium studio footwear imagery with clean material and sole definition.",
    vertical: "footwear",
    thumbnail: "/presets/footwear-studio.png",
    generationStrategyHint: "rigid_product",
    environment: "A seamless light concrete-grey studio with a subtle support or platform and no distracting commercial props.",
    composition: "A close product-led hero frame with disciplined negative space and enough scale to inspect the footwear construction.",
    camera: "True-to-product commercial footwear camera at a natural low three-quarter angle with exact perspective.",
    lighting: "Bright, softly sculpted studio illumination with refined material detail, natural shadow, and no harsh reflective glare.",
    mood: "Clean, confident, contemporary, and premium.",
    direction: "Present one shoe as a real campaign product, never as a sterile cutout or a generic e-commerce image.",
    recommendedTags: ["studio", "sneaker", "premium"],
  },
  {
    id: "footwear-street-lifestyle",
    title: "Street Lifestyle",
    shortDescription: "A shoe-led urban lifestyle frame with natural movement and contact.",
    vertical: "footwear",
    thumbnail: "/presets/footwear-street-lifestyle.png",
    generationStrategyHint: "footwear_on_model",
    environment: "Real city pavement and calm contemporary architecture in daylight, kept authentic and visually secondary to the footwear.",
    composition: "Low ground-level lower-body framing keeps both shoes large, readable, and more prominent than the torso or face.",
    camera: "Low-angle street footwear photography with natural perspective, credible scale, and focused detail at shoe height.",
    lighting: "Clean natural daylight with honest pavement texture, realistic material highlights, and strong believable contact shadows.",
    mood: "Urban, active, confident, and premium.",
    direction: "Show a believable standing or slow-step pose with correct ankle alignment, sole contact, and natural shoe flex.",
    recommendedTags: ["street", "on-foot", "lifestyle"],
  },
  {
    id: "cosmetics-studio",
    title: "Studio",
    shortDescription: "Luminous premium beauty product photography with exact packaging fidelity.",
    vertical: "cosmetics",
    thumbnail: "/presets/cosmetics-studio.png",
    generationStrategyHint: "rigid_product",
    environment: "A seamless warm light-beige beauty studio with one subtle neutral plinth at most and no competing props.",
    composition: "A close balanced product-first composition with elegant negative space, clear silhouette, and the package large in frame.",
    camera: "Refined commercial beauty product camera with true packaging proportions and controlled close focus.",
    lighting: "Luminous soft studio light with accurate glass, liquid, plastic, or metal response, gentle highlights, and a precise contact shadow.",
    mood: "Fresh, polished, clean, and premium.",
    direction: "Create a premium beauty campaign shot where package fidelity and material realism are more important than styling props.",
    recommendedTags: ["beauty", "studio", "product"],
  },
  {
    id: "cosmetics-aesthetic-setting",
    title: "Aesthetic Setting",
    shortDescription: "A refined beauty product setting that stays clean, tactile, and product-led.",
    vertical: "cosmetics",
    thumbnail: "/presets/cosmetics-aesthetic-setting.png",
    generationStrategyHint: "rigid_product",
    environment: "A warm travertine vanity surface or quiet plaster interior with one restrained architectural detail and no clutter.",
    composition: "A close product-forward campaign composition where environmental materials are soft, sparse, and secondary to the package.",
    camera: "Commercial tabletop beauty camera at a believable slightly elevated angle with accurate geometry and no perspective distortion.",
    lighting: "Warm side daylight with controlled soft shadows, truthful reflections, and material behavior appropriate to the supplied packaging.",
    mood: "Tactile, refined, calm, and modern.",
    direction: "Keep the product exact and singular while using the setting only to add tasteful premium context.",
    recommendedTags: ["vanity", "stone", "beauty"],
  },
  {
    id: "cosmetics-lifestyle-landscape",
    title: "Lifestyle Landscape",
    shortDescription: "Beauty product storytelling in a tasteful natural lifestyle environment.",
    vertical: "cosmetics",
    thumbnail: "/presets/cosmetics-lifestyle-landscape.png",
    generationStrategyHint: "rigid_product",
    environment: "A serene sunlit stone terrace or refined outdoor lifestyle surface with subtle botanical shadows and a softly defocused horizon.",
    composition: "A close hero-product frame where the landscape gives warmth and atmosphere but never makes the package small or secondary.",
    camera: "Elevated beauty campaign product photography with true package perspective, close detail, and restrained natural depth of field.",
    lighting: "Golden but believable natural daylight with physically plausible glass, liquid, plastic, and stone reflections.",
    mood: "Warm, healthy, serene, and premium.",
    direction: "Make the supplied package the immediate focus of a tasteful lifestyle scene without crowded scenery or generic props.",
    recommendedTags: ["outdoor", "lifestyle", "beauty"],
  },
] as const satisfies readonly PresetSeed[];

export const creativePresets: readonly CreativePreset[] = activePresetSeeds.map((preset, index) =>
  createPreset(preset, index + 1),
);

type ActivePresetId = (typeof activePresetSeeds)[number]["id"];
type LegacyPresetDefinition = {
  id: string;
  title: string;
  vertical: CreativePresetCategory;
  generationStrategyHint: GenerationStrategy;
  fallbackId: ActivePresetId;
};

const legacyPresetDefinitions: readonly LegacyPresetDefinition[] = [
  { id: "on-model-editorial", title: "On-Model Editorial", vertical: "apparel", generationStrategyHint: "fashion_on_model", fallbackId: "apparel-studio-style" },
  { id: "brutalist-streetwear", title: "Brutalist Streetwear", vertical: "apparel", generationStrategyHint: "fashion_on_model", fallbackId: "apparel-street-style" },
  { id: "urban-night", title: "Urban Streetwear", vertical: "apparel", generationStrategyHint: "fashion_on_model", fallbackId: "apparel-street-style" },
  { id: "minimal-studio-fashion", title: "Minimal Studio Fashion", vertical: "apparel", generationStrategyHint: "fashion_on_model", fallbackId: "apparel-studio-style" },
  { id: "back-print-focus", title: "Back Print Focus", vertical: "apparel", generationStrategyHint: "fashion_on_model", fallbackId: "apparel-studio-style" },
  { id: "front-hero-apparel", title: "Front Hero Apparel", vertical: "apparel", generationStrategyHint: "fashion_on_model", fallbackId: "apparel-studio-style" },
  { id: "editorial-flash", title: "Editorial Flash", vertical: "apparel", generationStrategyHint: "fashion_on_model", fallbackId: "apparel-street-style" },
  { id: "coastal-editorial", title: "Coastal Editorial", vertical: "apparel", generationStrategyHint: "fashion_on_model", fallbackId: "apparel-scenic-editorial" },
  { id: "luxury-macro-jewelry", title: "Luxury Macro Still Life", vertical: "jewelry", generationStrategyHint: "jewelry_still_life", fallbackId: "jewelry-studio" },
  { id: "soft-daylight-jewelry", title: "Soft Editorial Jewelry", vertical: "jewelry", generationStrategyHint: "jewelry_still_life", fallbackId: "jewelry-scenic" },
  { id: "black-luxury-jewelry", title: "Black Luxury", vertical: "jewelry", generationStrategyHint: "jewelry_still_life", fallbackId: "jewelry-studio" },
  { id: "jewelry-on-model", title: "Jewelry On Hand", vertical: "jewelry", generationStrategyHint: "jewelry_on_model", fallbackId: "jewelry-on-body" },
  { id: "stone-surface-jewelry", title: "Stone Surface", vertical: "jewelry", generationStrategyHint: "jewelry_still_life", fallbackId: "jewelry-scenic" },
  { id: "minimal-product-detail", title: "Minimal Detail", vertical: "jewelry", generationStrategyHint: "jewelry_still_life", fallbackId: "jewelry-studio" },
  { id: "watch-hero", title: "Watch Studio Close-up", vertical: "watches", generationStrategyHint: "rigid_product", fallbackId: "watch-bright-studio" },
  { id: "wrist-editorial", title: "Watch On Wrist Editorial", vertical: "watches", generationStrategyHint: "watch_on_wrist", fallbackId: "watch-on-wrist" },
  { id: "macro-dial", title: "Macro Dial", vertical: "watches", generationStrategyHint: "rigid_product", fallbackId: "watch-bright-studio" },
  { id: "dark-luxury-watch", title: "Luxury Watch Campaign", vertical: "watches", generationStrategyHint: "rigid_product", fallbackId: "watch-scenic-environment" },
  { id: "reflective-metal-watch", title: "Reflective Metal", vertical: "watches", generationStrategyHint: "rigid_product", fallbackId: "watch-bright-studio" },
  { id: "on-foot-editorial", title: "On-foot Editorial", vertical: "footwear", generationStrategyHint: "footwear_on_model", fallbackId: "footwear-street-lifestyle" },
  { id: "street-footwear", title: "On-Foot Street Campaign", vertical: "footwear", generationStrategyHint: "footwear_on_model", fallbackId: "footwear-street-lifestyle" },
  { id: "studio-footwear-hero", title: "Minimal Sneaker Studio", vertical: "footwear", generationStrategyHint: "rigid_product", fallbackId: "footwear-studio" },
  { id: "ground-level-campaign", title: "Ground-Level Campaign", vertical: "footwear", generationStrategyHint: "footwear_on_model", fallbackId: "footwear-street-lifestyle" },
  { id: "motion-step", title: "Motion Step", vertical: "footwear", generationStrategyHint: "footwear_on_model", fallbackId: "footwear-street-lifestyle" },
  { id: "footwear-material-detail", title: "Footwear Hero Close-up", vertical: "footwear", generationStrategyHint: "rigid_product", fallbackId: "footwear-hero-focus" },
  { id: "dark-premium-studio", title: "Premium Beauty Editorial", vertical: "cosmetics", generationStrategyHint: "rigid_product", fallbackId: "cosmetics-studio" },
  { id: "soft-daylight-product", title: "Soft Daylight Beauty", vertical: "cosmetics", generationStrategyHint: "rigid_product", fallbackId: "cosmetics-aesthetic-setting" },
  { id: "tabletop-lifestyle", title: "Warm Luxury Vanity Scene", vertical: "cosmetics", generationStrategyHint: "rigid_product", fallbackId: "cosmetics-aesthetic-setting" },
  { id: "reflective-luxury-surface", title: "Reflective Cosmetics", vertical: "cosmetics", generationStrategyHint: "rigid_product", fallbackId: "cosmetics-studio" },
  { id: "minimal-catalog-plus", title: "Clean Studio Product Shot", vertical: "cosmetics", generationStrategyHint: "rigid_product", fallbackId: "cosmetics-studio" },
];

export const historicalUnsupportedPresetIds = [
  ...legacyPresetDefinitions.map((preset) => preset.id),
  "tech-launch-hero",
] as const;

export type HistoricalPresetMetadata = Pick<CreativePreset, "category" | "id" | "title" | "useCase" | "vertical"> | {
  category: "product";
  id: "tech-launch-hero";
  title: "Tech Launch Hero";
  useCase: "product";
  vertical: "product";
};

const legacyOnlyPresetMetadata: readonly HistoricalPresetMetadata[] = [{
  id: "tech-launch-hero",
  title: "Tech Launch Hero",
  category: "product",
  vertical: "product",
  useCase: "product",
}];

/** Compatibility-only lookup for generations made before the active library was simplified. */
export function getHistoricalCreativePreset(id: unknown): CreativePreset | null {
  if (typeof id !== "string") return null;
  const legacy = legacyPresetDefinitions.find((preset) => preset.id === id);
  if (!legacy) return null;
  const fallback = creativePresets.find((preset) => preset.id === legacy.fallbackId);
  if (!fallback) return null;

  return {
    ...fallback,
    id: legacy.id,
    slug: legacy.id,
    title: legacy.title,
    category: legacy.vertical,
    vertical: legacy.vertical,
    useCase: legacy.vertical,
    generationStrategyHint: legacy.generationStrategyHint,
    enabled: false,
  };
}

export function getHistoricalPresetMetadata(id: unknown): HistoricalPresetMetadata | null {
  const preset = getHistoricalCreativePreset(id);
  if (preset) {
    return {
      id: preset.id,
      title: preset.title,
      category: preset.category,
      vertical: preset.vertical,
      useCase: preset.useCase,
    };
  }

  return typeof id === "string"
    ? legacyOnlyPresetMetadata.find((presetMetadata) => presetMetadata.id === id) ?? null
    : null;
}

export function getCreativePreset(id: unknown): CreativePreset | null {
  if (typeof id !== "string") return null;
  return creativePresets.find((preset) => preset.enabled && preset.id === id) ?? null;
}
