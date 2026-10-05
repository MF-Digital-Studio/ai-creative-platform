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

export type LocalizedPresetText = { tr: string; en: string };
export type PresetVariant = {
  id: string;
  familyId: string;
  sceneDirection: string;
  compositionDirection: string;
  lightingDirection: string;
  environmentDirection: string;
  constraints?: string[];
};
export type PresetFamily = {
  id: string;
  vertical: SupportedVertical;
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
  bags: {
    subject: "The supplied bag as the unmistakable commercial hero with its full construction readable.",
    pose: "Use a stable supported still life or a natural handheld, shoulder, or crossbody carry.",
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

type FamilySeed = Omit<PresetFamily, "variants"> & { variantSeeds: readonly PresetVariant[] };
function variants(familyId: string, entries: readonly [string, string, string, string][]): PresetVariant[] {
  return entries.map(([id, sceneDirection, compositionDirection, lightingDirection]) => ({
    id: `${familyId}-${id}`, familyId, sceneDirection, compositionDirection,
    lightingDirection, environmentDirection: sceneDirection,
  }));
}

const familySeeds: FamilySeed[] = [
  { id:"apparel-street", vertical:"apparel", title:{tr:"Sokak",en:"Street"}, description:{tr:"Gerçek şehir atmosferinde moda editoriali.",en:"Fashion editorial in a believable city setting."}, previewImage:"/images/presets/apparel-street.webp", generationStrategyHint:"fashion_on_model", legacyPresetId:"apparel-street-style", variantSeeds:variants("apparel-street",[
    ["metropolitan-sidewalk","Modern metropolitan sidewalk with restrained storefront architecture.","Walking or standing medium-to-full fashion frame.","Soft natural daylight."],["concrete-editorial","Brutalist concrete architecture and tactile surfaces.","Stronger editorial pose with garment silhouette open.","Directional daylight."],["rainy-city","Rain-washed downtown street with restrained pavement reflections.","Three-quarter street portrait with clean city depth.","Soft overcast cinematic daylight."],["downtown-crossing","Believable crosswalk and urban movement.","Editorial street photography with grounded environmental scale.","Balanced open-shade daylight."],["industrial-alley","Muted warehouse textures and industrial architecture.","Fashion campaign framing with product clearly separated.","Soft directional side light."],["evening-city","Premium city evening with subtle practical lights.","Refined night editorial, garment kept readable.","Natural practical lighting, no neon excess."],["historic-street","Tasteful historic stone architecture.","Elegant location editorial without tourist-photo framing.","Soft late daylight."],["minimal-urban","Clean urban wall and simple architectural lines.","Product-focused street composition with quiet negative space.","Neutral diffused daylight."]]) },
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
    ["handheld-city","Hand-held city editorial with uncluttered architecture.","Full bag body and grip remain visible.","Soft urban daylight."],["shoulder-carry","Natural shoulder carry adapted to source straps.","Protect bag body and strap placement.","Balanced daylight."],["under-arm","Under-arm fashion pose only where source shape permits.","Keep closure, logo, and body visible.","Soft directional light."],["crossbody","Natural crossbody carry only for a compatible strap system.","Show believable strap path and full bag.","Soft daylight."],["walking","Walking street fashion with believable movement.","Bag stays visible and grounded.","Natural editorial light."],["architecture","Minimal architectural fashion context.","Bag is the clear product hero.","Directional daylight."],["neutral","Elegant neutral styling.","Close-to-medium carry framing.","Soft warm light."],["evening","Subtle city evening styling.","Bag details remain readable.","Realistic practical lighting."]]) },
  { id:"bags-studio", vertical:"bags", title:{tr:"Stüdyo",en:"Studio"}, description:{tr:"Çanta formunu ve donanımını gösteren stüdyo.",en:"Studio imagery that shows the bag’s form and details."}, previewImage:"/images/presets/bags-studio.webp", generationStrategyHint:"rigid_product", legacyPresetId:"bags-minimal-studio", variantSeeds:variants("bags-studio",[
    ["white","Clean white studio.","Full silhouette, handles, closure, and base visible.","Bright soft light."],["beige","Warm beige luxury studio.","Product centered with clear negative space.","Soft warm key."],["dark","Dark premium studio.","Hardware and material remain distinct.","Controlled low-key light."],["pedestal","Single stable pedestal support.","Structured bag stands naturally.","Soft directional light."],["blocks","Minimal architectural blocks.","Bag remains fully visible.","Directional shadow."],["soft-shadow","Neutral studio with soft shadow.","Clear handle and body geometry.","Large soft source."],["reflective","Restrained reflective surface.","Reflection does not obscure bag.","Controlled highlights."],["monochrome","Tonal fashion studio set.","Full construction readable.","Balanced studio light."]]) },
  { id:"bags-lifestyle", vertical:"bags", title:{tr:"Estetik ortam",en:"Lifestyle setting"}, description:{tr:"Çantayı önde tutan rafine lifestyle ortamı.",en:"Refined lifestyle settings with the bag in focus."}, previewImage:"/images/presets/bags-lifestyle-setting.webp", generationStrategyHint:"rigid_product", legacyPresetId:"bags-street-editorial", variantSeeds:variants("bags-lifestyle",[
    ["cafe","Premium café tabletop with uncluttered context.","Bag body and handles fully visible.","Warm soft daylight."],["interior","Modern interior with restrained furniture.","Natural supported bag placement.","Window light."],["stone","Tasteful stone architecture.","Full silhouette clear.","Soft directional light."],["hotel","Quiet hotel or lobby aesthetic.","Bag remains commercial hero.","Warm practical light."],["city-furniture","Outdoor city furniture context.","Natural placement without excessive crop.","Daylight."],["coastal","Minimal coastal setting.","Bag remains large and visible.","Soft coastal light."],["travel","Luxury travel context without branded props.","Supported, complete product view.","Natural balanced light."],["editorial","Editorial architectural environment.","Clean composition protecting handles and body.","Directional light."]]) },
];

export const presetFamilies: readonly PresetFamily[] = familySeeds.map(({ variantSeeds, ...family }) => ({
  ...family,
  variants: variantSeeds,
}));

export function getPresetFamily(id: unknown): PresetFamily | null {
  return typeof id === "string" ? presetFamilies.find((family) => family.id === id) ?? null : null;
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

export function buildPresetVariantDirection(preset: CreativePreset, variant: PresetVariant): CreativePreset {
  const brief = preset.creativeDirection;
  const subtypeGuidance = preset.vertical === "jewelry"
    ? "Adapt body placement to the source jewelry subtype: ring on finger, bracelet on wrist, necklace on neck/collarbone, earrings on ear; never place a subtype on the wrong body region."
    : preset.vertical === "bags"
      ? "Adapt carry to the source bag subtype and actual source straps: crossbody only with its source crossbody strap, tote by its natural handles or shoulder fit, clutch hand-held, backpack on back/shoulders. Never add a carry system."
      : "";
  return {
    ...preset,
    creativeDirection: {
      ...brief,
      subject: preset.vertical === "bags"
        ? brief.subject.replace(/Show a natural crossbody carry with credible gravity and strap tension; keep the strap clear of the logo\./i, "Show the source bag with its existing carry system and credible gravity; keep identifying details clear.")
        : brief.subject,
      pose: `${brief.pose} ${variant.compositionDirection} ${subtypeGuidance}`.trim(),
      environment: variant.environmentDirection,
      composition: variant.compositionDirection,
      lighting: variant.lightingDirection,
      mood: `${brief.mood} ${variant.sceneDirection}`,
      negativeConstraints: `${brief.negativeConstraints} ${variant.constraints?.join(" ") ?? ""}`.trim(),
    },
  };
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
