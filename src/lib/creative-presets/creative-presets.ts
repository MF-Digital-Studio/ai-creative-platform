import type { CreativeBrief } from "@/lib/generation/prompts/creative-brief";
import { getFashionCaptureProfile, type FashionCaptureProfileId } from "@/lib/generation/prompts/fashion-capture-profiles";
import type { GenerationStrategy } from "@/lib/generation/strategy/generation-strategy";
import { supportedVerticals, type SupportedVertical } from "@/lib/verticals/supported-verticals";

export const creativePresetCategories = supportedVerticals;
export type CreativePresetCategory = SupportedVertical;
export const PRESET_SYSTEM_VERSION = "preset-system-v5" as const;
export const compatiblePresetSystemVersions = ["preset-system-v4", PRESET_SYSTEM_VERSION] as const;

export function isCompatiblePresetSystemVersion(value: unknown): value is (typeof compatiblePresetSystemVersions)[number] {
  return typeof value === "string" && compatiblePresetSystemVersions.includes(value as (typeof compatiblePresetSystemVersions)[number]);
}

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

export type LocalizedPresetText = { tr: string; en: string };
export type CreativeCaptureProfileId = FashionCaptureProfileId | "macro_luxury" | "clean_commercial" | "sculptural_editorial" | "natural_lifestyle" | "architectural_campaign" | "clinical_beauty" | "glossy_beauty" | "documentary_motion";
export type PresetHumanPresence = "none" | "partial" | "full";
export type PresetPresentationMode = {
  id: string;
  variantPresentationModes: readonly string[];
};
export type PresetVariant = {
  id: string;
  familyId: string;
  sceneDirection: string;
  compositionDirection: string;
  lightingDirection: string;
  environmentDirection: string;
  styleDirection?: string;
  poseDirection?: string;
  constraints?: string[];
  environment?: string; environmentSubtype?: string; timeOfDay?: string; weather?: string; lighting?: string; cameraDistance?: string; cameraAngle?: string; framing?: string; composition?: string; subjectPlacement?: string; pose?: string; movement?: string; interaction?: string; surface?: string; architecture?: string; propLanguage?: string; mood?: string; stylingNotes?: string; modelPresentation?: string; urbanArchitecture?: string; captureProfile?: CreativeCaptureProfileId;
  presentationMode?: string; productOrientation?: string; physicalSupport?: string; gravityBehavior?: string; humanPresence?: PresetHumanPresence; interactionMode?: string;
};
export type PresetFamily = {
  id: string;
  vertical: SupportedVertical;
  allowedSceneTypes: readonly string[];
  disallowedSceneTypes: readonly string[];
  styleVariants: readonly string[];
  compositionVariants: readonly string[];
  lightingVariants: readonly string[];
  poseVariants: readonly string[];
  environmentVariants: readonly string[];
  hardRules: readonly string[];
  softRules: readonly string[];
  title: LocalizedPresetText;
  description: LocalizedPresetText;
  previewImage: string;
  generationStrategyHint: GenerationStrategy;
  variants: readonly PresetVariant[];
  /** Active legacy preset used to preserve old callers and history. */
  legacyPresetId: string;
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
    pose: "Use a relaxed, believable editorial pose with open product-defining panels and no hands obscuring the garment. Choose a natural pose that fits this scene; avoid defaulting to hands in pockets.",
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
  bags: {
    subject: "The supplied bag as the unmistakable commercial hero with its full construction readable.",
    pose: "Use a stable, physically supported product placement that keeps the complete bag readable. Only use handheld, shoulder, or crossbody carry when the selected preset family or an explicit user request calls for it.",
    realism: "Use believable bag weight, gravity, handle support, hand grip, strap tension, and source-accurate material texture.",
    productTreatment: "Preserve bag type, silhouette, proportions, handles, straps, closure, pockets, seams, hardware, logo, print, material, color, and base.",
    negativeConstraints: "No substituted bag, added or missing components, floating strap, collapsed structured body, fused fingers, torso clipping, or CGI hardware.",
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
    thumbnail: "/images/presets/apparel-street.webp",
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
    thumbnail: "/images/presets/apparel-scenic.webp",
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
    thumbnail: "/images/presets/apparel-studio.webp",
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
    thumbnail: "/images/presets/jewelry-on-model.webp",
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
    thumbnail: "/images/presets/jewelry-studio.webp",
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
    thumbnail: "/images/presets/jewelry-lifestyle-still-life.webp",
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
    thumbnail: "/images/presets/watches-on-wrist.webp",
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
    thumbnail: "/images/presets/watches-product-composition.webp",
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
    thumbnail: "/images/presets/watches-editorial-studio.webp",
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
    thumbnail: "/images/presets/footwear-scenic-lifestyle.webp",
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
    thumbnail: "/images/presets/footwear-studio.webp",
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
    thumbnail: "/images/presets/footwear-street.webp",
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
    thumbnail: "/images/presets/cosmetics-studio.webp",
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
    thumbnail: "/images/presets/cosmetics-scenic-lifestyle.webp",
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
    thumbnail: "/images/presets/cosmetics-scenic-lifestyle.webp",
    generationStrategyHint: "rigid_product",
    environment: "A serene sunlit stone terrace or refined outdoor lifestyle surface with subtle botanical shadows and a softly defocused horizon.",
    composition: "A close hero-product frame where the landscape gives warmth and atmosphere but never makes the package small or secondary.",
    camera: "Elevated beauty campaign product photography with true package perspective, close detail, and restrained natural depth of field.",
    lighting: "Golden but believable natural daylight with physically plausible glass, liquid, plastic, and stone reflections.",
    mood: "Warm, healthy, serene, and premium.",
    direction: "Make the supplied package the immediate focus of a tasteful lifestyle scene without crowded scenery or generic props.",
    recommendedTags: ["outdoor", "lifestyle", "beauty"],
  },
  {
    id: "bags-street-editorial",
    title: "Street Editorial",
    shortDescription: "A city campaign that keeps the bag clear, prominent, and true to source.",
    vertical: "bags",
    thumbnail: "/images/presets/bags-lifestyle-setting.webp",
    generationStrategyHint: "rigid_product",
    environment: "A refined contemporary city street with authentic stone, glass, or concrete context kept visually secondary.",
    composition: "Bag-led medium-close editorial framing with the full bag body, handles, closure, logo, and strap visible.",
    camera: "Natural 50mm street editorial perspective with no distortion of the bag body or strap geometry.",
    lighting: "Soft daylight with realistic contact shadows and controlled reflections on leather and hardware.",
    mood: "Confident, urban, polished, and quietly premium.",
    direction: "Create a commercial street campaign around the exact supplied bag; never hide or redesign its construction.",
    recommendedTags: ["street", "editorial", "city"],
  },
  {
    id: "bags-minimal-studio",
    title: "Minimal Studio",
    shortDescription: "A quiet studio hero with every defining bag detail easy to inspect.",
    vertical: "bags",
    thumbnail: "/images/presets/bags-studio.webp",
    generationStrategyHint: "rigid_product",
    environment: "A seamless warm neutral studio with restrained surface texture and no competing props.",
    composition: "Close product-first framing showing the complete silhouette, handles, closure, logo, hardware, and credible base support.",
    camera: "Commercial three-quarter product camera with natural perspective and readable construction detail.",
    lighting: "Large soft studio source with source-accurate leather texture and restrained hardware highlights.",
    mood: "Minimal, tactile, composed, and premium.",
    direction: "Present the source bag as a single sharply readable hero without collapsing structured geometry.",
    recommendedTags: ["studio", "minimal", "product"],
  },
  {
    id: "bags-crossbody-lifestyle",
    title: "Crossbody Lifestyle",
    shortDescription: "Natural carry styling with believable strap contact and bag identity intact.",
    vertical: "bags",
    thumbnail: "/images/presets/bags-on-model.webp",
    generationStrategyHint: "bags_on_model",
    environment: "A softly lit city or travel setting with uncluttered architecture and believable human scale.",
    composition: "Medium-close torso framing with a clear crossbody strap path and the full bag body, closure, and logo visible.",
    camera: "Natural editorial portrait perspective with realistic scale and no stretched bag proportions.",
    lighting: "Soft daylight with natural skin detail, clear bag materials, and grounded contact shadows.",
    mood: "Easy, contemporary, practical, and premium.",
    direction: "Show a natural crossbody carry with credible gravity and strap tension; keep the strap clear of the logo.",
    recommendedTags: ["crossbody", "lifestyle", "travel"],
  },
] as const satisfies readonly PresetSeed[];

export const creativePresets: readonly CreativePreset[] = activePresetSeeds.map((preset, index) =>
  createPreset(preset, index + 1),
);

type FamilySeed = Omit<PresetFamily, "variants" | "allowedSceneTypes" | "disallowedSceneTypes" | "styleVariants" | "compositionVariants" | "lightingVariants" | "poseVariants" | "environmentVariants" | "hardRules" | "softRules"> & { variantSeeds: readonly PresetVariant[] };
function variants(familyId: string, entries: readonly [string, string, string, string][]): PresetVariant[] {
  return entries.map(([id, sceneDirection, compositionDirection, lightingDirection]) => ({
    id: `${familyId}-${id}`, familyId, sceneDirection, compositionDirection,
    lightingDirection, environmentDirection: sceneDirection,
  }));
}

const familySeeds: FamilySeed[] = [
  { id:"apparel-street", vertical:"apparel", title:{tr:"Sokak",en:"Street"}, description:{tr:"Gerçek şehir atmosferinde moda editoriali.",en:"Fashion editorial in a believable city setting."}, previewImage:"/images/presets/apparel-street.webp", generationStrategyHint:"fashion_on_model", legacyPresetId:"apparel-street-style", variantSeeds:[
    { ...variants("apparel-street",[["modern-boulevard","Bright modern boulevard with clean concrete architecture.","Full-body wide environmental portrait, walking toward camera.","Soft daylight."]])[0]!, environment:"modern boulevard",timeOfDay:"day",weather:"dry",lighting:"soft daylight",cameraDistance:"wide",cameraAngle:"eye-level",framing:"full-body off-center",pose:"arms relaxed",movement:"walking toward camera",modelPresentation:"commercial fashion model with varied presentation",urbanArchitecture:"modern concrete",captureProfile:"natural_editorial_daylight" },
    { ...variants("apparel-street",[["overcast-sidewalk","Overcast city sidewalk with tactile pavement.","Knees-up side-profile walking frame.","Overcast diffused light."]])[0]!, environment:"city sidewalk",timeOfDay:"day",weather:"overcast",lighting:"diffused",cameraDistance:"medium",cameraAngle:"side angle",framing:"knees-up",pose:"looking away",movement:"side-profile walking",urbanArchitecture:"contemporary street",captureProfile:"natural_editorial_daylight" },
    { ...variants("apparel-street",[["storefront-day","Daytime storefront on a lively pedestrian street.","Waist-up candid turn with storefront context.","Storefront daylight spill."]])[0]!, environment:"daytime storefront",timeOfDay:"day",weather:"clear",lighting:"ambient storefront spill",cameraDistance:"close",cameraAngle:"three-quarter",framing:"waist-up",pose:"adjusting cuff",movement:"candid turn",urbanArchitecture:"retail frontage",captureProfile:"natural_editorial_daylight" },
    { ...variants("apparel-street",[["residential-european","Quiet European residential street with stone facades.","Full-body seated urban moment, wide frame.","Soft late daylight."]])[0]!, environment:"residential street",timeOfDay:"afternoon",weather:"dry",lighting:"soft daylight",cameraDistance:"wide",cameraAngle:"eye-level",framing:"full-body",pose:"seated",movement:"still moment",urbanArchitecture:"residential stone",captureProfile:"natural_editorial_daylight" },
    { ...variants("apparel-street",[["hard-sun-crossing","Sunlit city crossing with crisp architectural shadows.","Low-angle full-body crossing street.","Hard midday sun."]])[0]!, environment:"city crossing",timeOfDay:"midday",weather:"clear",lighting:"hard sun",cameraDistance:"wide",cameraAngle:"low angle",framing:"full-body",pose:"natural stride",movement:"crossing street",urbanArchitecture:"boulevard",captureProfile:"editorial_flash" },
    { ...variants("apparel-street",[["rainy-city","Rainy night street with restrained wet pavement reflections.","Knees-up direct flash street portrait.","Direct flash against night ambience."]])[0]!, environment:"rainy downtown",timeOfDay:"night",weather:"rain",lighting:"direct flash",cameraDistance:"medium",cameraAngle:"eye-level",framing:"knees-up",pose:"one hand relaxed",movement:"editorial standing",urbanArchitecture:"downtown storefronts",captureProfile:"urban_night_flash" },
    { ...variants("apparel-street",[["dry-neon-district","Dry neon district with graphic signs and no rain.","Wide side-angle moving-through-frame portrait.","Ambient night light."]])[0]!, environment:"neon district",timeOfDay:"night",weather:"dry",lighting:"ambient night",cameraDistance:"wide",cameraAngle:"side angle",framing:"wide environmental",pose:"arms naturally down",movement:"moving through frame",urbanArchitecture:"commercial neon",captureProfile:"editorial_flash" },
    { ...variants("apparel-street",[["parking-structure","Open concrete parking structure with deep geometric lines.","Low-angle knees-up leaning portrait.","Hard directional practical light."]])[0]!, environment:"parking structure",timeOfDay:"evening",weather:"dry",lighting:"hard directional",cameraDistance:"medium",cameraAngle:"low angle",framing:"knees-up",pose:"leaning against architecture",movement:"static editorial",urbanArchitecture:"parking concrete",captureProfile:"editorial_flash" },
    { ...variants("apparel-street",[["metro-exit","Busy metro entrance with candid urban movement.","Off-center wide documentary frame, model descending stairs.","Mixed ambient light."]])[0]!, environment:"metro entrance",timeOfDay:"evening",weather:"dry",lighting:"mixed ambient",cameraDistance:"wide",cameraAngle:"high angle",framing:"off-center wide",pose:"natural stride",movement:"descending stairs",urbanArchitecture:"transit architecture",captureProfile:"natural_editorial_daylight" },
    { ...variants("apparel-street",[["industrial-alley","Industrial alley with brick, raw concrete, and loading doors.","Three-quarter side angle, walking away then turning.","Soft directional side light."]])[0]!, environment:"industrial alley",timeOfDay:"day",weather:"overcast",lighting:"soft side light",cameraDistance:"medium",cameraAngle:"side angle",framing:"three-quarter",pose:"candid turn",movement:"turning while walking",urbanArchitecture:"industrial brick",captureProfile:"editorial_flash" },
    { ...variants("apparel-street",[["glass-facade","Glass office facade with crisp reflections and clean lines.","Slight telephoto knees-up architectural portrait.","Architectural daylight."]])[0]!, environment:"glass office facade",timeOfDay:"day",weather:"clear",lighting:"architectural daylight",cameraDistance:"telephoto",cameraAngle:"eye-level",framing:"knees-up",pose:"editorial standing",movement:"still moment",urbanArchitecture:"glass office",captureProfile:"natural_editorial_daylight" },
    { ...variants("apparel-street",[["golden-hour-street","Warm evening storefront with late sun on stone buildings.","Full-body leaning portrait with warm city depth.","Warm dusk light."]])[0]!, environment:"warm storefront",timeOfDay:"golden hour",weather:"clear",lighting:"warm dusk",cameraDistance:"medium",cameraAngle:"three-quarter",framing:"full-body",pose:"leaning against architecture",movement:"still moment",urbanArchitecture:"stone retail district",captureProfile:"natural_editorial_daylight" },
    { ...variants("apparel-street",[["stone-architecture","Historic stone architecture on a calm city block.","Slight telephoto off-center static editorial portrait.","Soft daylight."]])[0]!, environment:"historic street",timeOfDay:"afternoon",weather:"overcast",lighting:"diffused",cameraDistance:"telephoto",cameraAngle:"three-quarter",framing:"off-center portrait",pose:"editorial standing",movement:"static editorial",urbanArchitecture:"historic stone",captureProfile:"natural_editorial_daylight" },
  ] },
  { id:"apparel-studio", vertical:"apparel", title:{tr:"Stüdyo",en:"Studio"}, description:{tr:"Kontrollü stüdyo ışığında ürün odaklı moda.",en:"Product-led fashion under controlled studio light."}, previewImage:"/images/presets/apparel-studio.webp", generationStrategyHint:"fashion_on_model", legacyPresetId:"apparel-studio-style", variantSeeds:variants("apparel-studio",[
    ["soft-gray","Soft gray seamless cyclorama.","Balanced three-quarter framing.","Large soft key and gentle fill."],["warm-beige","Warm beige studio backdrop.","Relaxed editorial stance, full garment visible.","Warm soft directional light."],["high-key-white","Clean high-key white editorial set.","Open full-body composition.","Bright wraparound studio light."],["dark-charcoal","Dark charcoal fashion studio.","Confident medium-to-full framing.","Controlled sculpting key with detail-preserving fill."],["hard-light","Minimal neutral studio.","Graphic fashion pose with clear garment panels.","Directional hard-light editorial shadows."],["window-light","Quiet studio with a broad window-like source.","Natural relaxed pose and medium framing.","Soft window light."],["shadow-play","Simple studio wall with architectural shadow shapes.","Clean negative space around silhouette.","Soft light with deliberate shadow play."],["monochrome","Premium tonal monochrome studio.","Polished campaign framing.","Refined low-contrast studio lighting."]]) },
  { id:"apparel-scenic", vertical:"apparel", title:{tr:"Estetik manzara",en:"Scenic"}, description:{tr:"Doğal ve rafine mekanlarda premium moda çekimi.",en:"Premium fashion imagery in refined natural locations."}, previewImage:"/images/presets/apparel-scenic.webp", generationStrategyHint:"fashion_on_model", legacyPresetId:"apparel-scenic-editorial", variantSeeds:variants("apparel-scenic",[
    ["rocky-coast","Tactile rocky coastline with a restrained horizon.","Editorial full or three-quarter fashion frame.","Soft coastal daylight."],["mountain","Grounded mountain landscape with realistic depth.","Fashion remains dominant over the location.","Clear natural daylight."],["dry-landscape","Muted desert or dry landscape, no fantasy forms.","Refined editorial framing with breathing room.","Warm, restrained daylight."],["open-field","Open grassland with subtle natural texture.","Relaxed campaign pose and visible garment silhouette.","Soft overcast daylight."],["lakeside","Quiet lakeside landscape with calm reflections.","Medium-to-full editorial composition.","Balanced natural light."],["cliff-stone","Cliffside stone forms with believable scale.","Product-led three-quarter view.","Directional soft daylight."],["forest-edge","Open forest edge, not dense foliage.","Garment unobstructed against natural depth.","Diffused canopy light."],["minimal-dune","Minimal beach or dune with neutral sand tones.","Clean fashion editorial, not a travel snapshot.","Soft late-day light, natural color."]]) },
  { id:"watches-on-wrist", vertical:"watches", title:{tr:"Bilekte",en:"On wrist"}, description:{tr:"Doğal bilek temasını ve kadranı öne çıkaran çekim.",en:"A wrist composition with natural fit and a clear dial."}, previewImage:"/images/presets/watches-on-wrist.webp", generationStrategyHint:"watch_on_wrist", legacyPresetId:"watch-on-wrist", variantSeeds:variants("watches-on-wrist",[
    ["suit-cuff","Tailored suit cuff with refined luxury context.","Close wrist-led crop with unobstructed dial.","Soft luxury directional light."],["casual-knit","Textured casual knit sleeve.","Natural wrist angle and readable watch face.","Soft daylight."],["outdoor","Quiet outdoor architecture and believable daylight.","Close wrist composition with product dominant.","Open-shade natural light."],["car-interior","Restrained premium car interior context.","Natural hand and wrist placement, watch clear.","Window daylight, realistic reflections."],["cafe-table","Café table interaction with relaxed wrist placement.","Close tabletop/wrist editorial frame.","Warm soft ambient light."],["dark-clothing","Minimal dark sleeve and background.","Precise crop protecting dial and crown.","Controlled low-key light."],["architectural-daylight","Clean architectural daylight setting.","Wrist framed against simple geometry.","Directional natural light."],["evening-luxury","Subtle evening luxury environment.","Premium close wrist portrait.","Practical warm light, realistic exposure."]]) },
  { id:"watches-product-composition", vertical:"watches", title:{tr:"Ürün kompozisyonu",en:"Product composition"}, description:{tr:"Saatin detaylarını öne çıkaran rafine ürün düzeni.",en:"A refined product arrangement that highlights watch details."}, previewImage:"/images/presets/watches-product-composition.webp", generationStrategyHint:"rigid_product", legacyPresetId:"watch-bright-studio", variantSeeds:variants("watches-product-composition",[
    ["watch-box","Unbranded premium watch box.","Three-quarter watch view, uncluttered.","Soft controlled highlights."],["stone-pedestal","Single understated stone pedestal.","Hero composition with full watch visible.","Directional soft studio light."],["dark-wood","Dark wood surface with subtle grain.","Low three-quarter commercial view.","Warm restrained highlights."],["leather-surface","Minimal leather surface, no extra branding.","Close product composition.","Soft raking light."],["brushed-metal","One brushed-metal support object.","Watch remains distinct from support.","Controlled metallic reflections."],["architectural-block","Simple architectural block support.","Graphic negative space around watch.","Directional shadow."],["luxury-desk","Sparse luxury desk arrangement.","Clear product-first tabletop frame.","Balanced practical light."],["soft-fabric","Tasteful neutral fabric support.","Natural supported pose, full silhouette visible.","Soft studio light."]]) },
  { id:"watches-editorial-studio", vertical:"watches", title:{tr:"Estetik stüdyo",en:"Editorial studio"}, description:{tr:"Saat için kontrollü, yaratıcı stüdyo atmosferi.",en:"A controlled, creative studio setting for watches."}, previewImage:"/images/presets/watches-editorial-studio.webp", generationStrategyHint:"rigid_product", legacyPresetId:"watch-scenic-environment", variantSeeds:variants("watches-editorial-studio",[
    ["black-reflective","Restrained black reflective surface.","Close sculptural hero frame.","Low-key controlled light."],["warm-neutral","Warm neutral luxury set.","Balanced three-quarter framing.","Soft warm key."],["spotlight","Minimal dark studio.","Watch centered with disciplined negative space.","Dramatic but detail-preserving spotlight."],["monochrome","Minimal monochrome set.","Clear complete watch silhouette.","Even sculpted studio light."],["soft-gradient","Soft neutral gradient backdrop.","Product-led commercial close-up.","Smooth gradient lighting."],["metallic","Subtle metallic studio environment.","Watch separated from background.","Controlled reflections."],["architectural-shadow","Architectural studio shadow setup.","Graphic but legible watch composition.","Directional shadow light."],["catalogue","High-end catalogue studio.","Precise, clear dial and construction.","Balanced commercial lighting."]]) },
  { id:"jewelry-on-model", vertical:"jewelry", title:{tr:"Vücut üzerinde",en:"On model"}, description:{tr:"Takı türüne uygun doğal vücut temasıyla editorial.",en:"Editorial jewelry with natural subtype-appropriate body contact."}, previewImage:"/images/presets/jewelry-on-model.webp", generationStrategyHint:"jewelry_on_model", legacyPresetId:"jewelry-on-body", variantSeeds:variants("jewelry-on-model",[
    ["soft-daylight","Quiet neutral editorial setting.","Close crop of correct jewelry placement area.","Soft daylight with honest skin texture."],["luxury-skin","Premium clean background.","Intimate close body-led composition.","Sculpted luxury light."],["dark-dramatic","Dark fashion background kept secondary.","Jewelry large and legible.","Controlled dramatic light."],["warm-natural","Warm natural environment.","Relaxed close portrait around correct body region.","Warm diffused daylight."],["minimal-beauty","Clean minimal beauty setting.","Product-first close framing.","Soft clean light."],["evening-editorial","Refined evening editorial context.","Elegant close composition.","Practical light with controlled reflections."],["soft-fabric","Neutral fabric near the body.","Natural jewelry contact, fabric secondary.","Soft directional light."],["architectural-closeup","Quiet architectural fashion setting.","Close crop protecting scale and detail.","Directional daylight."]]) },
  { id:"jewelry-lifestyle", vertical:"jewelry", title:{tr:"Estetik ortam",en:"Lifestyle still life"}, description:{tr:"Takıyı önde tutan premium dokulu ortam.",en:"Premium tactile settings that keep jewelry in the lead."}, previewImage:"/images/presets/jewelry-lifestyle-still-life.webp", generationStrategyHint:"jewelry_still_life", legacyPresetId:"jewelry-scenic", variantSeeds:variants("jewelry-lifestyle",[
    ["natural-stone","Quiet natural stone surface.","Close sculptural jewelry hero.","Soft directional daylight."],["soft-fabric","Tasteful folded soft fabric.","Jewelry fully supported and visible.","Gentle diffused light."],["vanity","Minimal luxury vanity with no extra branded objects.","Close product-led still life.","Warm soft light."],["sun-shadow","Simple surface with sunlight and shadow.","Jewelry remains large and unobstructed.","Natural directional sun."],["warm-wood","Warm wood with subtle grain.","Refined tabletop close-up.","Soft warm key."],["reflective-glass","Controlled reflective glass support.","Avoid obscuring jewelry with reflections.","Clean highlight control."],["architecture","Quiet architectural surface.","Elegant negative space.","Directional light."],["botanical","Subtle minimal botanical context.","No prop touches or overwhelms product.","Soft natural light."]]) },
  { id:"jewelry-studio", vertical:"jewelry", title:{tr:"Stüdyo",en:"Studio"}, description:{tr:"Takı detayları için kontrollü ürün stüdyosu.",en:"Controlled product studio for jewelry detail."}, previewImage:"/images/presets/jewelry-studio.webp", generationStrategyHint:"jewelry_still_life", legacyPresetId:"jewelry-studio", variantSeeds:variants("jewelry-studio",[
    ["clean-white","Clean white studio.","Full jewelry form on disciplined negative space.","Bright controlled softbox."],["soft-gray","Soft gray studio backdrop.","Close clear product framing.","Soft sculpted light."],["black-luxury","Black luxury studio.","Jewelry separated clearly from background.","Controlled edge highlights."],["warm-beige","Warm beige studio.","Centered premium close-up.","Warm soft key."],["reflective-acrylic","Minimal reflective acrylic support.","Reflections remain secondary.","Controlled studio highlights."],["pedestal","Single minimal pedestal.","Full piece visible, no clutter.","Soft directional key."],["hard-shadow","Neutral set with graphic shadow.","Product clear against the shadow.","Directional hard light."],["soft-gradient","Subtle neutral gradient background.","Product-first close framing.","Soft even gradient light."]]) },
  { id:"footwear-street", vertical:"footwear", title:{tr:"Sokak",en:"Street"}, description:{tr:"Şehir ortamında ayakkabı odaklı kampanya.",en:"Footwear-led campaign in a believable city setting."}, previewImage:"/images/presets/footwear-street.webp", generationStrategyHint:"footwear_on_model", legacyPresetId:"footwear-street-lifestyle", variantSeeds:variants("footwear-street",[
    ["sidewalk","Modern city sidewalk.","Low framing, shoes remain clear.","Natural daylight."],["crosswalk","Believable city crosswalk.","Ground-level editorial movement.","Open shade."],["concrete","Concrete architecture.","Product-first lower-body composition.","Directional daylight."],["industrial","Muted industrial street textures.","Clear shoe silhouette and sole.","Soft side light."],["rainy","Wet pavement with restrained reflections.","Stable foot contact, no distracting crop.","Overcast light."],["skate-urban","Tasteful skate-inspired urban texture.","Believable stance, footwear dominant.","Natural daylight."],["minimal-metropolitan","Minimal metropolitan street.","Clean negative space around shoes.","Soft daylight."],["evening","Subtle evening city lighting.","Both shoes remain readable.","Realistic practical light."]]) },
  { id:"footwear-studio", vertical:"footwear", title:{tr:"Stüdyo",en:"Studio"}, description:{tr:"Ayakkabı siluetini ve yapısını gösteren stüdyo.",en:"Studio imagery that clearly shows footwear construction."}, previewImage:"/images/presets/footwear-studio.webp", generationStrategyHint:"rigid_product", legacyPresetId:"footwear-studio", variantSeeds:variants("footwear-studio",[
    ["white","Clean white studio.","Complete footwear silhouette.","Bright soft light."],["gray","Commercial gray studio.","Three-quarter construction view.","Balanced studio lighting."],["dark","Dark dramatic studio.","Sole and panels remain legible.","Controlled low-key light."],["pedestal","Single simple pedestal.","Stable product support.","Soft directional key."],["soft-shadow","Neutral set with soft shadow.","Clear side and sole profile.","Large soft source."],["monochrome","Tonal monochrome set.","Footwear isolated in frame.","Even sculpted light."],["reflective-floor","Subtle reflective floor.","Reflection does not obscure sole.","Controlled highlights."],["blocks","Minimal architectural blocks.","Full product remains unobstructed.","Directional light."]]) },
  { id:"footwear-scenic", vertical:"footwear", title:{tr:"Estetik ortam",en:"Scenic lifestyle"}, description:{tr:"Rafine dış mekanlarda ayakkabı kampanyası.",en:"Footwear campaign in refined outdoor settings."}, previewImage:"/images/presets/footwear-scenic-lifestyle.webp", generationStrategyHint:"rigid_product", legacyPresetId:"footwear-hero-focus", variantSeeds:variants("footwear-scenic",[
    ["rocky","Grounded rocky landscape.","Footwear large, scene secondary.","Soft daylight."],["coastal","Restrained coastal setting.","Natural perspective and clear product.","Balanced coastal light."],["architecture","Modern outdoor architecture.","Product-led composition.","Directional daylight."],["desert","Muted dry landscape surface.","Close campaign framing.","Warm natural light."],["grass","Natural grass or open field.","Footwear remains prominent.","Soft open shade."],["stairs","Minimal outdoor stone stairs.","Believable foot contact.","Natural daylight."],["stone","Tactile stone environment.","Three-quarter hero angle.","Soft side light."],["travel","Premium travel context without clutter.","Footwear remains clear and large.","Natural soft light."]]) },
  { id:"cosmetics-studio", vertical:"cosmetics", title:{tr:"Stüdyo",en:"Studio"}, description:{tr:"Ambalaj detaylarını koruyan beauty stüdyosu.",en:"Beauty studio that preserves packaging details."}, previewImage:"/images/presets/cosmetics-studio.webp", generationStrategyHint:"rigid_product", legacyPresetId:"cosmetics-studio", variantSeeds:variants("cosmetics-studio",[
    ["white","Clean white commercial studio.","Package large with label area clear.","Bright soft studio light."],["beige","Soft beige beauty set.","Product-first composition.","Warm diffused light."],["glossy","Restrained glossy reflective studio.","Reflection stays below package.","Controlled highlights."],["gradient","Subtle tonal gradient backdrop.","Centered premium product frame.","Soft gradient light."],["dark","Dramatic dark cosmetics studio.","Packaging remains fully readable.","Low-key detail-preserving light."],["shadow","Minimal soft-shadow studio.","Clean negative space.","Directional soft light."],["acrylic","Glass or acrylic support, no clutter.","Package stays unobscured.","Controlled refraction and reflection."],["monochrome","Premium monochrome set.","Full package silhouette visible.","Balanced editorial light."]]) },
  { id:"cosmetics-scenic", vertical:"cosmetics", title:{tr:"Estetik ortam",en:"Scenic lifestyle"}, description:{tr:"Ambalajı gölgelemeyen rafine lifestyle sahnesi.",en:"Refined lifestyle settings that never obscure packaging."}, previewImage:"/images/presets/cosmetics-scenic-lifestyle.webp", generationStrategyHint:"rigid_product", legacyPresetId:"cosmetics-aesthetic-setting", variantSeeds:variants("cosmetics-scenic",[
    ["stone","Quiet natural stone surface.","Close package-forward frame.","Soft daylight."],["water","Controlled water or wet surface detail.","Label remains dry, clear, unobstructed.","Clean reflective light."],["botanical","Minimal botanical context.","Package stays dominant.","Soft natural light."],["coastal","Coastal light and neutral textures.","Close product composition.","Bright restrained daylight."],["sunlight","Warm sunlight across a simple surface.","Protect label readability.","Natural warm light."],["vanity","Luxury bathroom or vanity surface, no brand props.","Packaging fully visible.","Soft warm practical light."],["organic","Restrained organic tactile textures.","No clutter around package.","Diffused daylight."],["landscape","Minimal landscape-inspired setting.","Product stays large and unmistakable.","Natural balanced light."]]) },
  { id:"bags-on-model", vertical:"bags", title:{tr:"Model üzerinde",en:"On model"}, description:{tr:"Çantaya uygun doğal taşıma ve gerçekçi temas.",en:"Natural carry styling adapted to the bag type."}, previewImage:"/images/presets/bags-on-model.webp", generationStrategyHint:"bags_on_model", legacyPresetId:"bags-crossbody-lifestyle", variantSeeds:variants("bags-on-model",[
    ["walking-street","Woman walking on a refined city street, naturally carrying the bag.","Editorial walking frame with the complete bag and carry contact clearly visible.","Soft urban daylight."],["cafe-seated","Woman seated at an elegant café with the bag naturally beside her.","Relaxed seated composition with the bag prominent and unobstructed.","Warm window daylight."],["shoulder-city","Elegant city scene with a woman carrying the bag on her shoulder when its source strap permits.","Medium editorial frame protecting the full bag body and strap path.","Balanced daylight."],["terrace-seated","Woman seated on a refined terrace, interacting naturally with the bag.","Product-led seated composition with the bag clearly readable.","Soft late-afternoon daylight."],["shopping-street","Woman moving through a tasteful shopping street with a natural source-compatible carry.","Dynamic lifestyle frame with the bag kept sharp, complete, and dominant.","Clear natural daylight."],["editorial-standing","Woman in a minimal architectural setting with an editorial standing pose and natural bag carry.","Polished standing composition with the complete bag visible.","Directional editorial daylight."],["casual-walking","Woman in a casual walking scene with believable movement and source-compatible grip or carry.","Natural full-to-three-quarter frame with the bag unobstructed.","Soft open-shade light."],["urban-lifestyle","Refined urban lifestyle setting with a model using the bag naturally.","Elegant medium composition where the bag remains the hero.","Realistic city evening light."]]) },
  { id:"bags-studio", vertical:"bags", title:{tr:"Stüdyo",en:"Studio"}, description:{tr:"Çanta formunu ve donanımını gösteren stüdyo.",en:"Studio imagery that shows the bag’s form and details."}, previewImage:"/images/presets/bags-studio.webp", generationStrategyHint:"rigid_product", legacyPresetId:"bags-minimal-studio", variantSeeds:variants("bags-studio",[
    ["white","Clean white product-only studio; no people or lifestyle setting.","Full silhouette, handles, closure, and base visible on a supported surface.","Bright soft light."],["beige","Warm beige product-only studio; no people or body contact.","Product centered with clear negative space.","Soft warm key."],["dark","Dark product-only studio; no model or fashion portrait.","Hardware and material remain distinct.","Controlled low-key light."],["pedestal","Product-only studio with a single stable pedestal; no people or hands.","Structured bag stands naturally without a hand or body.","Soft directional light."],["blocks","Product-only studio with minimal architectural blocks and no people.","Bag remains fully visible and unsupported by people.","Directional shadow."],["soft-shadow","Neutral product-only studio with soft shadow and no human presence.","Clear handle and body geometry.","Large soft source."],["reflective","Product-only studio with a restrained reflective surface; no people or lifestyle scene.","Reflection does not obscure bag.","Controlled highlights."],["monochrome","Tonal product-only studio set with no model or body contact.","Full construction readable.","Balanced studio light."]]) },
  { id:"bags-lifestyle", vertical:"bags", title:{tr:"Estetik ortam",en:"Lifestyle setting"}, description:{tr:"Çantayı önde tutan rafine lifestyle ortamı.",en:"Refined lifestyle settings with the bag in focus."}, previewImage:"/images/presets/bags-lifestyle-setting.webp", generationStrategyHint:"rigid_product", legacyPresetId:"bags-street-editorial", variantSeeds:variants("bags-lifestyle",[
    ["cafe-table","Product-only café tabletop setting; no people, hands, or body contact.","Bag placed naturally on the table with body and handles fully visible.","Warm soft daylight."],["terrace","Product-only beautiful terrace setting; no people or worn interaction.","Naturally supported hero placement with the complete bag unobstructed.","Soft late-afternoon daylight."],["elegant-interior","Product-only elegant interior with restrained furniture and no human presence.","Natural supported placement with the bag dominant.","Refined window light."],["scenic-outdoor","Product-only scenic outdoor setting with no people or hands.","Stable environmental placement; full silhouette remains clear.","Balanced natural daylight."],["bench","Product-only placement on a tasteful architectural bench; no person or body contact.","Natural resting position without excessive crop.","Soft open-shade daylight."],["window-light","Product-only interior placement near a window with no human interaction.","Bag placed naturally on a stable surface and kept large in frame.","Directional natural window light."],["architecture","Product-only refined architectural environment; no people or worn carry.","Clean composition protecting handles, body, and identifying details.","Graphic directional light."],["travel-setting","Product-only refined travel setting without people, hands, or branded props.","Supported complete product view with the environment secondary.","Natural balanced light."]]) },
];

const familyVariantSupplements: Partial<Record<string, readonly PresetVariant[]>> = {
  "apparel-studio": variants("apparel-studio", [["color-field", "Controlled studio with a restrained tonal color field.", "Asymmetric full-body fashion frame with clean silhouette separation.", "Soft colored bounce with neutral product color."], ["floor-seated", "Minimal daylight studio with a visible seamless floor.", "Grounded seated editorial pose with every garment-defining panel readable.", "Broad side key with gentle floor bounce."], ["folded-catalogue", "Clean product studio with a quiet tonal sweep and no person.", "Folded garment composition with every identity-critical panel legible.", "Broad catalogue light with realistic fold shadows."], ["fabric-motion", "Minimal product studio with no person or body parts.", "Suspended garment in a subtle fabric-motion moment with the complete SKU recognizable.", "Short directional studio light that freezes believable cloth movement."]]),
  "apparel-scenic": variants("apparel-scenic", [["modern-terrace", "Elevated modern terrace with honest architectural depth.", "Three-quarter walking portrait with the landscape kept secondary.", "Clear morning side light."], ["stone-courtyard", "Quiet stone courtyard with tactile walls and open sky.", "Centered full-body still portrait with generous breathing room.", "Soft blue-hour ambient light."]]),
  "watches-on-wrist": variants("watches-on-wrist", [["travel-lounge", "Restrained premium travel lounge context.", "Candid wrist interaction with luggage details kept abstract and secondary.", "Soft window daylight."], ["stone-terrace", "Outdoor stone terrace with no visual clutter.", "Natural resting forearm with dial and crown side fully legible.", "Warm late-day side light."]]),
  "jewelry-on-model": variants("jewelry-on-model", [["direct-flash-beauty", "Minimal beauty set with honest skin texture.", "Tight graphic crop at the subtype-correct body region.", "Restrained direct flash with controlled metal highlights."], ["profile-window", "Quiet window-side editorial setting.", "Subtype-aware profile composition with natural contact and scale.", "Raking window light with soft falloff."]]),
  "jewelry-lifestyle": variants("jewelry-lifestyle", [["mirror-plane", "Human-free editorial environment with one clean mirror plane.", "Low sculptural macro angle with a single controlled reflection.", "Narrow directional highlight."], ["plaster-gallery", "Human-free plaster gallery ledge with subtle texture.", "Off-center jewelry hero with architectural negative space.", "Diffuse skylight."]]),
  "footwear-street": variants("footwear-street", [["metro-platform", "Urban metro platform with recognizable transit geometry.", "Low moving frame with credible planted foot and sharp footwear.", "Mixed practical transit light."], ["storefront-night", "Dry night storefront street with restrained practical light.", "Ground-level paused stride with both shoes readable.", "Compact direct flash balanced with storefront ambience."]]),
  "footwear-scenic": variants("footwear-scenic", [["gallery-courtyard", "Human-free contemporary gallery courtyard.", "Sculptural product placement against clean architectural depth.", "Open-shade daylight."], ["hotel-interior", "Human-free premium hotel interior with stone and wood restraint.", "Close three-quarter footwear hero on a stable architectural surface.", "Warm window and practical light mix."]]),
  "cosmetics-scenic": variants("cosmetics-scenic", [["glasshouse", "Human-free glasshouse ledge with soft condensation beyond the product.", "Package-forward frame with clear label and layered natural depth.", "Diffused humid daylight."], ["mineral-shelf", "Human-free mineral plaster shelf with one tonal material accent.", "Asymmetric close hero with ample label clearance.", "Raking afternoon light."]]),
  "bags-on-model": variants("bags-on-model", [["hotel-arrival", "Adult model arriving through a refined hotel entrance with source-compatible carry.", "Candid three-quarter movement with the complete bag clear of the body.", "Soft entrance daylight."], ["gallery-walk", "Adult model walking through minimal gallery architecture with natural bag interaction.", "Wide architectural fashion frame while the bag remains sharp and dominant.", "Diffuse skylight."]]),
  "bags-lifestyle": variants("bags-lifestyle", [["gallery-plinth", "Product-only gallery plinth setting with no people or hands.", "Sculptural three-quarter bag view with complete handles and base visible.", "Directional gallery light."], ["hotel-console", "Product-only premium hotel console setting without people or branded props.", "Natural supported placement with restrained interior depth.", "Warm practical and window-light balance."]]),
};

const structuredDimensionCycles = {
  cameraDistance: ["macro", "close", "medium", "wide", "telephoto", "close", "medium", "wide"],
  cameraAngle: ["eye-level", "low angle", "three-quarter", "overhead", "side angle", "high angle", "front-on", "ground-level"],
  framing: ["tight detail", "close hero", "three-quarter", "environmental wide", "off-center negative space", "centered symmetry", "diagonal composition", "full silhouette"],
  subjectPlacement: ["centered", "lower third", "left third", "right third", "foreground anchored", "asymmetric center", "diagonal anchor", "center with negative space"],
  timeOfDay: ["day", "morning", "afternoon", "golden hour", "evening", "day", "blue hour", "midday"],
  weather: ["controlled", "clear", "overcast", "dry", "controlled", "clear", "dry", "controlled"],
} as const;

const humanPresentations = [
  "adult woman with short natural curls and understated styling", "adult man with close-cropped hair and relaxed styling", "adult androgynous model with shoulder-length dark hair", "mature adult woman with a natural updo and refined styling", "adult man with wavy medium-length hair and minimal styling", "adult woman with a short graphic haircut and confident posture", "mature adult man with natural gray hair and quiet styling", "adult androgynous model with tied-back textured hair",
] as const;

const captureProfilesByVertical: Record<SupportedVertical, readonly CreativeCaptureProfileId[]> = {
  apparel: ["natural_editorial_daylight", "soft_studio_fashion", "editorial_flash", "urban_night_flash"], jewelry: ["macro_luxury", "sculptural_editorial", "clean_commercial", "natural_lifestyle"], watches: ["clean_commercial", "architectural_campaign", "macro_luxury", "natural_lifestyle"], cosmetics: ["clinical_beauty", "glossy_beauty", "clean_commercial", "sculptural_editorial"], footwear: ["architectural_campaign", "documentary_motion", "clean_commercial", "natural_lifestyle"], bags: ["natural_lifestyle", "architectural_campaign", "clean_commercial", "sculptural_editorial"],
};

const presentationModesByFamily: Record<string, readonly string[]> = {
  "apparel-studio": ["model_studio", "ghost_mannequin", "floating_front", "floating_three_quarter", "suspended_garment", "hanger_editorial", "flat_lay", "sculptural_product_stage", "macro_detail", "catalogue_product_only", "folded_composition", "fabric_motion"],
  "apparel-street": ["walking", "curb", "crosswalk", "metro_stairs", "storefront", "concrete_district", "low_angle_street", "movement_detail", "seated_urban_moment", "night_editorial"],
  "apparel-scenic": ["model_landscape", "architectural_model", "walking_location", "seated_location", "environmental_portrait"],
  "footwear-studio": ["isolated_hero", "floating_product", "pedestal", "reflective_floor", "sculptural_blocks", "pair_composition", "single_shoe_three_quarter", "top_down", "side_profile_campaign", "macro_material_detail"],
  "footwear-scenic": ["architectural_stone", "gallery", "terrace", "courtyard", "luxury_interior", "coast", "modern_exterior", "stairs", "hotel_setting", "minimal_landscape"],
  "footwear-street": ["walking", "curb", "crosswalk", "metro_stairs", "storefront", "concrete_district", "low_angle_street", "movement_detail", "seated_urban_moment", "night_editorial"],
  "bags-studio": ["front_hero", "three_quarter_hero", "suspended_bag", "pedestal", "stacked_blocks", "reflective_floor", "top_down", "hardware_macro"],
  "bags-lifestyle": ["cafe", "terrace", "gallery", "hotel", "architecture", "window_light", "travel_setting", "shelf_styling", "stone_surface", "editorial_still_life"],
  "bags-on-model": ["shoulder_carry", "hand_carry", "crossbody", "seated", "walking", "full_body", "waist_crop", "side_angle", "movement", "urban_editorial"],
  "jewelry-studio": ["macro", "suspended", "pedestal", "reflection", "textile", "stone", "shadow", "clean_packshot"],
  "jewelry-lifestyle": ["stone", "textile", "reflection", "vanity", "architecture", "shadow", "editorial_still_life", "botanical"],
  "jewelry-on-model": ["on_hand", "on_neck", "on_ear", "on_wrist", "beauty_macro", "profile", "movement", "editorial_closeup"],
  "watches-on-wrist": ["wrist", "cuff", "desk_interaction", "travel", "architectural", "outdoor", "evening", "editorial_closeup"],
  "watches-product-composition": ["product_hero", "side_profile", "crown_macro", "desk", "travel", "architectural", "reflection", "soft_support"],
  "watches-editorial-studio": ["product_hero", "side_profile", "crown_macro", "pedestal", "reflection", "architectural", "shadow", "editorial_studio"],
  "cosmetics-studio": ["packshot", "floating", "liquid_interaction", "acrylic", "reflection", "monochrome", "clinical", "glossy_editorial"],
  "cosmetics-scenic": ["botanical", "stone", "water_interaction", "window_light", "shelf_styling", "travel_setting", "clinical_lifestyle", "glossy_editorial"],
};

const productOnlyApparelModes = new Set(["ghost_mannequin", "floating_front", "floating_three_quarter", "suspended_garment", "hanger_editorial", "flat_lay", "folded_composition", "sculptural_product_stage", "fabric_motion", "macro_detail", "catalogue_product_only"]);

export function isProductOnlyPresentationMode(mode: string | null | undefined): boolean {
  return Boolean(mode && productOnlyApparelModes.has(mode));
}

const presentationModeGroups: Partial<Record<string, readonly PresetPresentationMode[]>> = {
  "apparel-studio": [
    { id: "model_studio", variantPresentationModes: ["model_studio"] }, { id: "ghost_mannequin", variantPresentationModes: ["ghost_mannequin"] },
    { id: "floating", variantPresentationModes: ["floating_front", "floating_three_quarter"] }, { id: "hanger", variantPresentationModes: ["hanger_editorial"] },
    { id: "flat_lay", variantPresentationModes: ["flat_lay"] }, { id: "folded", variantPresentationModes: ["folded_composition"] },
    { id: "sculptural_stage", variantPresentationModes: ["sculptural_product_stage"] }, { id: "fabric_motion", variantPresentationModes: ["fabric_motion"] },
    { id: "detail", variantPresentationModes: ["macro_detail"] }, { id: "catalogue_product", variantPresentationModes: ["catalogue_product_only"] },
  ],
  "footwear-studio": ["isolated_hero", "floating_product", "pedestal", "reflective_floor", "sculptural_blocks", "pair_composition", "top_down", "side_profile_campaign", "macro_material_detail"].map((id) => ({ id, variantPresentationModes: [id] })),
  "footwear-street": ["walking", "crosswalk", "concrete_district", "metro_stairs", "seated_urban_moment", "movement_detail", "low_angle_street"].map((id) => ({ id, variantPresentationModes: [id] })),
  "footwear-scenic": ["architectural_stone", "terrace", "gallery", "courtyard", "hotel_setting", "minimal_landscape"].map((id) => ({ id, variantPresentationModes: [id] })),
  "bags-studio": ["front_hero", "three_quarter_hero", "suspended_bag", "pedestal", "top_down", "reflective_floor", "hardware_macro"].map((id) => ({ id, variantPresentationModes: [id] })),
  "bags-on-model": ["shoulder_carry", "hand_carry", "crossbody", "walking", "seated", "full_body", "waist_crop", "urban_editorial"].map((id) => ({ id, variantPresentationModes: [id] })),
  "bags-lifestyle": ["cafe", "terrace", "gallery", "hotel", "architecture", "window_light", "travel_setting", "editorial_still_life"].map((id) => ({ id, variantPresentationModes: [id] })),
  "jewelry-studio": ["macro", "pedestal", "reflection", "stone", "textile", "shadow", "clean_packshot"].map((id) => ({ id, variantPresentationModes: [id] })),
  "jewelry-on-model": ["on_neck", "on_ear", "on_hand", "on_wrist", "beauty_macro", "editorial_closeup"].map((id) => ({ id, variantPresentationModes: [id] })),
  "jewelry-lifestyle": [{ id: "stone", variantPresentationModes: ["stone"] }, { id: "textile", variantPresentationModes: ["textile"] }, { id: "mirror", variantPresentationModes: ["reflection"] }, { id: "gallery", variantPresentationModes: ["architecture"] }, { id: "reflective_surface", variantPresentationModes: ["reflection"] }, { id: "editorial_still_life", variantPresentationModes: ["editorial_still_life"] }],
  "watches-on-wrist": [{ id: "wrist_hero", variantPresentationModes: ["wrist"] }, { id: "executive", variantPresentationModes: ["cuff"] }, { id: "travel", variantPresentationModes: ["travel"] }, { id: "outdoor", variantPresentationModes: ["outdoor"] }, { id: "architecture", variantPresentationModes: ["architectural"] }, { id: "lifestyle_closeup", variantPresentationModes: ["editorial_closeup"] }],
  "watches-product-composition": [{ id: "desk", variantPresentationModes: ["desk"] }, { id: "stone", variantPresentationModes: ["side_profile"] }, { id: "leather", variantPresentationModes: ["crown_macro"] }, { id: "metal", variantPresentationModes: ["travel"] }, { id: "fabric", variantPresentationModes: ["soft_support"] }, { id: "box_composition", variantPresentationModes: ["product_hero"] }, { id: "macro_detail", variantPresentationModes: ["crown_macro"] }],
  "watches-editorial-studio": [{ id: "dark_studio", variantPresentationModes: ["product_hero"] }, { id: "gradient", variantPresentationModes: ["reflection"] }, { id: "metallic", variantPresentationModes: ["architectural"] }, { id: "spotlight", variantPresentationModes: ["crown_macro"] }, { id: "reflection", variantPresentationModes: ["reflection"] }, { id: "catalogue", variantPresentationModes: ["editorial_studio"] }],
  "cosmetics-studio": [{ id: "packshot", variantPresentationModes: ["packshot"] }, { id: "floating", variantPresentationModes: ["floating"] }, { id: "acrylic", variantPresentationModes: ["acrylic"] }, { id: "reflection", variantPresentationModes: ["reflection"] }, { id: "monochrome", variantPresentationModes: ["monochrome"] }, { id: "clinical", variantPresentationModes: ["clinical"] }, { id: "glossy", variantPresentationModes: ["glossy_editorial"] }, { id: "shadow_play", variantPresentationModes: ["glossy_editorial"] }],
  "cosmetics-scenic": [{ id: "water", variantPresentationModes: ["water_interaction"] }, { id: "stone", variantPresentationModes: ["stone"] }, { id: "botanical", variantPresentationModes: ["botanical"] }, { id: "glasshouse", variantPresentationModes: ["glasshouse"] }, { id: "architecture", variantPresentationModes: ["shelf_styling"] }, { id: "material_study", variantPresentationModes: ["clinical_lifestyle"] }, { id: "natural_light", variantPresentationModes: ["window_light"] }],
};

export function getPresetPresentationModes(familyId: unknown): readonly PresetPresentationMode[] {
  const family = getPresetFamily(familyId);
  if (!family) return [];
  const configured = presentationModeGroups[family.id] ?? [];
  const valid = configured.filter(({ variantPresentationModes }) => family.variants.some((variant) => variant.presentationMode && variantPresentationModes.includes(variant.presentationMode)));
  return valid.length ? valid : [...new Set(family.variants.map(({ presentationMode }) => presentationMode).filter((mode): mode is string => Boolean(mode)))].map((id) => ({ id, variantPresentationModes: [id] }));
}

export function getPresetPresentationMode(familyId: unknown, modeId: unknown): PresetPresentationMode | null {
  return typeof modeId === "string" ? getPresetPresentationModes(familyId).find(({ id }) => id === modeId) ?? null : null;
}

export function getPresetVariantsForPresentationMode(family: PresetFamily, modeId: string | null | undefined): readonly PresetVariant[] {
  const mode = getPresetPresentationMode(family.id, modeId);
  return mode ? family.variants.filter((variant) => variant.presentationMode && mode.variantPresentationModes.includes(variant.presentationMode)) : family.variants;
}

function isHumanFamily(family: Pick<FamilySeed, "generationStrategyHint">): boolean {
  return ["fashion_on_model", "jewelry_on_model", "watch_on_wrist", "footwear_on_model", "bags_on_model"].includes(family.generationStrategyHint);
}

function structureVariant(family: FamilySeed, variant: PresetVariant, index: number): PresetVariant {
  const cycle = <T,>(values: readonly T[], offset = 0) => values[(index + offset) % values.length]!;
  const studio = /studio/.test(family.id);
  const human = isHumanFamily(family);
  const environment = variant.environment ?? variant.environmentDirection.replace(/[.;]$/g, "");
  const presentationModes = presentationModesByFamily[family.id] ?? [human ? "on_model" : "product_hero"];
  const presentationMode = variant.presentationMode ?? cycle(presentationModes);
  const humanPresence: PresetHumanPresence = variant.humanPresence ?? (isProductOnlyPresentationMode(presentationMode) ? "none" : human ? presentationMode.includes("macro") || presentationMode.includes("wrist") || presentationMode.includes("hand") ? "partial" : "full" : "none");
  const floating = /floating|suspended|fabric_motion/.test(presentationMode);
  const flat = /flat_lay|top_down|folded/.test(presentationMode);
  return {
    ...variant,
    environment,
    environmentSubtype: variant.environmentSubtype ?? variant.id.slice(`${family.id}-`.length),
    timeOfDay: variant.timeOfDay ?? (studio ? "controlled" : cycle(structuredDimensionCycles.timeOfDay)),
    weather: variant.weather ?? (studio ? "controlled" : cycle(structuredDimensionCycles.weather, 2)),
    lighting: variant.lighting ?? variant.lightingDirection.replace(/[.;]$/g, ""),
    cameraDistance: variant.cameraDistance ?? cycle(structuredDimensionCycles.cameraDistance), cameraAngle: variant.cameraAngle ?? cycle(structuredDimensionCycles.cameraAngle, 1), framing: variant.framing ?? cycle(structuredDimensionCycles.framing, 2), composition: variant.composition ?? variant.compositionDirection, subjectPlacement: variant.subjectPlacement ?? cycle(structuredDimensionCycles.subjectPlacement, 3),
    pose: variant.pose ?? variant.poseDirection ?? (human ? cycle(["relaxed stance", "natural stride", "seated interaction", "editorial stillness", "candid turn", "grounded step", "profile stance", "subtle lean"]) : "stable product placement"),
    movement: variant.movement ?? (human ? cycle(["still moment", "walking", "subtle turn", "seated pause", "reaching naturally", "mid-step", "weight shift", "candid movement"]) : "still life"),
    interaction: variant.interaction ?? (human ? family.vertical === "watches" ? "natural wrist fit" : family.vertical === "jewelry" ? "subtype-appropriate body contact" : family.vertical === "bags" ? "source-compatible natural carry" : family.vertical === "footwear" ? "credible foot contact and weight" : "garment worn naturally" : "product-only supported placement"),
    surface: variant.surface ?? (studio ? cycle(["seamless sweep", "matte tabletop", "tonal pedestal", "reflective acrylic", "textured paper", "stone plinth", "gloss floor", "fabric support"]) : cycle(["stone", "concrete", "wood", "glass", "textile", "pavement", "metal", "natural ground"])),
    architecture: variant.architecture ?? variant.urbanArchitecture ?? (studio ? "controlled studio set" : environment),
    propLanguage: variant.propLanguage ?? (studio ? cycle(["none", "single pedestal", "geometric block", "mirror plane", "single translucent panel", "shadow-only", "tonal support", "one material sample"]) : cycle(["none", "restrained functional objects", "one contextual object", "architectural elements only", "natural material accents", "no decorative clutter", "single tactile accent", "environmental details only"])),
    mood: variant.mood ?? cycle(["quiet luxury", "graphic precision", "tactile warmth", "confident editorial", "clean modernity", "intimate refinement", "architectural calm", "raw premium realism"]),
    stylingNotes: variant.stylingNotes ?? (human ? "Vary age presentation, hair, wardrobe styling, posture, and camera relationship; do not preserve a face unless continuity is explicit." : "Keep styling product-led and props subordinate to identity-critical details."),
    modelPresentation: variant.modelPresentation ?? (human ? cycle(humanPresentations) : undefined), captureProfile: variant.captureProfile ?? cycle(captureProfilesByVertical[family.vertical]),
    presentationMode,
    productOrientation: variant.productOrientation ?? (flat ? "top_down" : /side_profile|profile/.test(presentationMode) ? "side_profile" : /front|packshot|catalogue/.test(presentationMode) ? "front" : "three_quarter"),
    physicalSupport: variant.physicalSupport ?? (floating ? "suspended_without_visible_body" : flat ? "studio_surface" : humanPresence === "none" ? cycle(["surface", "pedestal", "sculptural_block", "reflective_floor"]) : "anatomically_plausible_body_contact"),
    gravityBehavior: variant.gravityBehavior ?? (floating ? "natural_suspension_and_fabric_weight" : humanPresence === "none" ? "grounded_with_realistic_weight" : "natural_body_load_and_contact"),
    humanPresence,
    interactionMode: variant.interactionMode ?? (humanPresence === "none" ? "product_only" : variant.interaction ?? "natural_product_body_interaction"),
  };
}

function sceneContract(family: FamilySeed): Pick<PresetFamily, "allowedSceneTypes" | "disallowedSceneTypes" | "styleVariants" | "compositionVariants" | "lightingVariants" | "poseVariants" | "environmentVariants" | "hardRules" | "softRules"> {
  const id = family.id;
  const studio = /studio/.test(id) || id === "watches-editorial-studio";
  const street = /street/.test(id);
  const onModel = isHumanFamily(family);
  const mixedApparelStudio = id === "apparel-studio";
  const productStudio = studio && !onModel;
  const aesthetic = !studio && !street && !onModel;
  const allowedSceneTypes = street ? ["urban_street", ...(onModel ? ["human_interaction"] : [])] : mixedApparelStudio ? ["controlled_human_studio", "controlled_product_studio", "human_interaction", "product_only_apparel"] : studio && onModel ? ["controlled_human_studio", "human_interaction"] : productStudio ? ["controlled_product_studio"] : onModel ? ["human_interaction", "editorial_lifestyle"] : ["human_free_editorial_environment"];
  const disallowedSceneTypes = productStudio ? ["people", "hands", "body_contact", "street", "cafe", "living_space", "outdoors"] : aesthetic ? ["people", "hands", "body_contact", "worn", "carried"] : onModel && !mixedApparelStudio ? ["product_only_still_life"] : [];
  const hardRules = mixedApparelStudio
    ? ["Controlled apparel studio photography only.", "Honor the selected presentation mode: human modes require a real model; product-only modes require no visible person, skin, phantom limbs, or mannequin hardware."]
    : productStudio
    ? ["Product-led controlled studio photography only.", "No people, hands, body contact, street, cafe, living space, or outdoor location."]
    : studio && onModel
      ? ["Controlled studio photography with a visible model interaction only; never turn this family into a lifestyle location or product-only still life."]
    : aesthetic
      ? ["Keep the product as hero in a visibly styled environment.", "No people, hands, body contact, wearing, or carrying."]
      : onModel
        ? ["A visible person or body part must meaningfully interact with the product."]
        : ["The scene must contain recognizable urban street architecture or street-level context."];
  return {
    allowedSceneTypes, disallowedSceneTypes,
    styleVariants: [...new Set(family.variantSeeds.map((variant) => variant.styleDirection ?? variant.sceneDirection))],
    compositionVariants: [...new Set(family.variantSeeds.map((variant) => variant.compositionDirection))],
    lightingVariants: [...new Set(family.variantSeeds.map((variant) => variant.lightingDirection))],
    poseVariants: onModel ? [...new Set(family.variantSeeds.map((variant) => variant.pose ?? variant.poseDirection ?? variant.compositionDirection))] : [],
    environmentVariants: [...new Set(family.variantSeeds.map((variant) => variant.environmentDirection))],
    hardRules,
    softRules: ["Keep the supplied product dominant and identity details visible.", "Vary framing and styling within the selected family without changing its scene identity."],
  };
}

export const presetFamilies: readonly PresetFamily[] = familySeeds.map(({ variantSeeds, ...family }) => ({
  ...family,
  ...sceneContract({ ...family, variantSeeds: [...variantSeeds, ...(familyVariantSupplements[family.id] ?? [])] }),
  variants: [...variantSeeds, ...(familyVariantSupplements[family.id] ?? [])].map((variant, index, expandedVariants) => structureVariant({ ...family, variantSeeds: expandedVariants }, variant, index)),
}));

export function getPresetFamily(id: unknown): PresetFamily | null {
  return typeof id === "string" ? presetFamilies.find((family) => family.id === id) ?? null : null;
}

export function getPresetFamilyForPresetId(id: unknown): PresetFamily | null {
  return typeof id === "string" ? presetFamilies.find((family) => family.id === id || family.legacyPresetId === id) ?? null : null;
}

export function resolvePresetVariant({ family, previousVariantId, generationSeed }: {
  family: PresetFamily; previousVariantId?: string | null; generationSeed: string;
}): PresetVariant {
  const candidates = family.variants.filter((variant) => variant.id !== previousVariantId);
  const pool = candidates.length ? candidates : family.variants;
  let hash = 2166136261;
  for (const character of generationSeed) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return pool[(hash >>> 0) % pool.length];
}

export function resolvePresetVariantFromRun(family: PresetFamily, generationSeed: string): PresetVariant {
  let hash = 2166136261;
  for (const character of generationSeed) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return family.variants[(hash >>> 0) % family.variants.length]!;
}

type PresetVariationDimension = "environment" | "environmentSubtype" | "timeOfDay" | "weather" | "lighting" | "cameraDistance" | "cameraAngle" | "framing" | "composition" | "subjectPlacement" | "pose" | "movement" | "interaction" | "surface" | "architecture" | "propLanguage" | "mood" | "modelPresentation" | "captureProfile" | "presentationMode" | "productOrientation" | "physicalSupport" | "gravityBehavior" | "humanPresence" | "interactionMode";
export type PresetVariationHistory = { [Key in PresetVariationDimension]?: PresetVariant[Key] | null } & { variantId?: string | null };

const semanticDimensions = ["environment", "environmentSubtype", "timeOfDay", "weather", "lighting", "cameraDistance", "cameraAngle", "framing", "composition", "subjectPlacement", "pose", "movement", "interaction", "surface", "architecture", "propLanguage", "mood", "modelPresentation", "captureProfile", "presentationMode", "productOrientation", "physicalSupport", "gravityBehavior", "humanPresence", "interactionMode"] as const;

export function scorePresetVariantSemanticDistance(variant: PresetVariant, previous: PresetVariationHistory): number {
  return semanticDimensions.reduce((score, key) => previous[key] === undefined || previous[key] === null ? score : score + (previous[key] === variant[key] ? -3 : 1), previous.variantId === variant.id ? -16 : 0);
}

export function resolvePresetVariantWithHistory(family: PresetFamily, generationSeed: string, previousVariantId?: string | null, history: readonly PresetVariationHistory[] = []): PresetVariant {
  const hash = (value: string) => { let result = 2166136261; for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619); return result >>> 0; };
  const ranked = family.variants.map((variant) => {
    const distance = history.reduce((score, previous, historyIndex) => score + scorePresetVariantSemanticDistance(variant, previous) * Math.max(1, 4 - historyIndex), 0);
    return { variant, distance };
  }).sort((a, b) => b.distance - a.distance || a.variant.id.localeCompare(b.variant.id));
  const max = ranked[0]?.distance ?? 0;
  const pool = ranked.filter(({ distance }) => distance === max);
  const chosen = pool[hash(generationSeed) % pool.length]?.variant ?? resolvePresetVariantFromRun(family, generationSeed);
  if (!history.length && chosen.id === previousVariantId && family.variants.length > 1) return family.variants[(family.variants.findIndex(({ id }) => id === chosen.id) + 1) % family.variants.length]!;
  return chosen;
}

export function getPresetVariationMetadata(variant: PresetVariant) {
  return { environment: variant.environment ?? variant.environmentDirection, environmentSubtype: variant.environmentSubtype ?? null, timeOfDay: variant.timeOfDay ?? null, weather: variant.weather ?? null, lighting: variant.lighting ?? variant.lightingDirection, cameraDistance: variant.cameraDistance ?? null, cameraAngle: variant.cameraAngle ?? null, framing: variant.framing ?? variant.compositionDirection, composition: variant.composition ?? variant.compositionDirection, subjectPlacement: variant.subjectPlacement ?? null, pose: variant.pose ?? variant.poseDirection ?? variant.compositionDirection, movement: variant.movement ?? null, interaction: variant.interaction ?? null, surface: variant.surface ?? null, architecture: variant.architecture ?? variant.urbanArchitecture ?? null, propLanguage: variant.propLanguage ?? null, mood: variant.mood ?? null, stylingNotes: variant.stylingNotes ?? null, modelPresentation: variant.modelPresentation ?? null, captureProfile: variant.captureProfile ?? null, presentationMode: variant.presentationMode ?? null, productOrientation: variant.productOrientation ?? null, physicalSupport: variant.physicalSupport ?? null, gravityBehavior: variant.gravityBehavior ?? null, humanPresence: variant.humanPresence ?? null, interactionMode: variant.interactionMode ?? null };
}

export function buildPresetVariantDirection(preset: CreativePreset, variant: PresetVariant): CreativePreset {
  const brief = preset.creativeDirection;
  const subtypeGuidance = preset.vertical === "jewelry"
    ? "Adapt body placement to the source jewelry subtype: ring on finger, bracelet on wrist, necklace on neck/collarbone, earrings on ear; never place a subtype on the wrong body region."
    : preset.vertical === "bags" && preset.id === "bags-on-model"
      ? "Adapt carry to the source bag subtype and actual source straps: crossbody only with its source crossbody strap, tote by its natural handles or shoulder fit, clutch hand-held, backpack on back/shoulders. Never add a carry system."
      : "";
  return {
    ...preset,
    creativeDirection: {
      ...brief,
      ...(preset.vertical === "bags" && preset.id === "bags-studio" ? { pose: "Show the complete bag standing naturally on a tabletop, pedestal, or stable product support with handles and straps arranged visibly." } : {}),
      pose: `${preset.vertical === "bags" && preset.id === "bags-studio" ? "Present the complete bag on a stable tabletop, pedestal, or product support, with its handles and straps naturally arranged and all construction visible." : isProductOnlyPresentationMode(variant.presentationMode) ? "Present the garment without a human body, visible skin, hands, feet, or phantom limbs." : brief.pose} ${variant.compositionDirection} ${subtypeGuidance}`.trim(),
      environment: variant.environmentDirection,
      composition: variant.compositionDirection,
      lighting: variant.lightingDirection,
      realism: isProductOnlyPresentationMode(variant.presentationMode)
        ? "Use physically plausible fabric weight, gravity, folds, collar and sleeve shaping, seams, surface texture, and contact shadows. Ghost volume must contain no visible mannequin, skin, or implied human limbs. Floating modes must never create phantom hands, feet, or body parts."
        : brief.realism,
      subject: `${isProductOnlyPresentationMode(variant.presentationMode) ? "The supplied garment alone is the commercial hero. Preserve its exact cut, construction, seams, color, graphics and proportions." : preset.vertical === "bags" ? brief.subject.replace(/Show a natural crossbody carry with credible gravity and strap tension; keep the strap clear of the logo\./i, "Show the source bag with its existing carry system and credible gravity; keep identifying details clear.") : brief.subject} ${variant.familyId === "apparel-street" ? `Model presentation: ${variant.modelPresentation ?? "commercial adult fashion model with natural, varied styling"}. Vary human identity unless the reference or explicit user direction requires continuity.` : ""} Presentation mode: ${variant.presentationMode ?? "family_default"}; orientation: ${variant.productOrientation ?? "natural"}; support: ${variant.physicalSupport ?? "natural"}; gravity: ${variant.gravityBehavior ?? "physically_plausible"}; human presence: ${variant.humanPresence ?? "family_default"}; interaction: ${variant.interactionMode ?? "family_default"}. Selected preset scene identity: ${familySceneSummary(variant.familyId)}.`,
      camera: `${brief.camera} ${variant.styleDirection ?? ""}`.trim(),
      capture: preset.vertical === "apparel" && variant.captureProfile ? getFashionCaptureProfile(variant.captureProfile as FashionCaptureProfileId) : brief.capture,
      mood: `${brief.mood} ${variant.sceneDirection}`,
      negativeConstraints: `${brief.negativeConstraints} ${isProductOnlyPresentationMode(variant.presentationMode) ? "No person, skin, hands, feet, face, phantom limbs, visible mannequin, rigid cardboard cutout, altered garment cut, graphics, seams, color, or proportions." : ""} ${getPresetFamily(variant.familyId)?.hardRules.join(" ") ?? ""} ${variant.constraints?.join(" ") ?? ""}`.trim(),
    },
  };
}

function familySceneSummary(familyId: string): string {
  const family = getPresetFamily(familyId);
  if (!family) return "preserve the selected preset family";
  return `family ${family.id}; allowed scenes ${family.allowedSceneTypes.join(", ")}; excluded scenes ${family.disallowedSceneTypes.join(", ")}`;
}

export function getRecommendedPresets({
  vertical,
  selectedPresetId,
}: {
  vertical?: SupportedVertical | null;
  selectedPresetId?: string | null;
}): CreativePreset[] {
  return getRecommendedFamilyPresets({ vertical, selectedPresetId }).slice(0, 6);
}

export type RecommendedFamilyPreset = CreativePreset & { localizedTitle: LocalizedPresetText; localizedDescription: LocalizedPresetText };

export function getRecommendedFamilyPresets({ vertical, selectedPresetId }: {
  vertical?: SupportedVertical | null; selectedPresetId?: string | null;
}): RecommendedFamilyPreset[] {
  const matchingFamilies = vertical ? presetFamilies.filter((family) => family.vertical === vertical) : presetFamilies;
  const choices = matchingFamilies.map((family): RecommendedFamilyPreset | null => {
    const base = getCreativePreset(family.id);
    if (!base) return null;
    return { ...base, title: family.title.en, shortDescription: family.description.en, localizedTitle: family.title, localizedDescription: family.description };
  }).filter((preset): preset is RecommendedFamilyPreset => preset !== null);
  if (selectedPresetId && !choices.some((preset) => preset.id === selectedPresetId)) {
    const selected = getCreativePreset(selectedPresetId);
    if (selected) {
      const family = getPresetFamily(selected.id);
      if (family) choices.push({ ...selected, localizedTitle: family.title, localizedDescription: family.description });
    }
  }
  return choices;
}

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
  const family = getPresetFamily(id);
  const presetId = family?.legacyPresetId ?? id;
  const preset = creativePresets.find((candidate) => candidate.enabled && candidate.id === presetId) ?? null;
  if (!preset || !family) return preset;
  return {
    ...preset,
    id: family.id,
    slug: family.id,
    title: family.title.en,
    shortDescription: family.description.en,
    category: family.vertical,
    vertical: family.vertical,
    useCase: family.vertical,
    generationStrategyHint: family.generationStrategyHint,
    thumbnail: family.previewImage,
  };
}
