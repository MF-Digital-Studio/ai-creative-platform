import type { CreativeBrief } from "@/lib/generation/prompts/creative-brief";
import { getFashionCaptureProfile } from "@/lib/generation/prompts/fashion-capture-profiles";
import type { GenerationStrategy } from "@/lib/generation/strategy/generation-strategy";

export const creativePresetCategories = ["fashion", "jewelry", "product"] as const;

export type CreativePresetCategory = (typeof creativePresetCategories)[number];

export type CreativePreset = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: CreativePresetCategory;
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

type CreativePresetDefinition = Omit<
  CreativePreset,
  | "enabled" | "generationMode" | "generationStrategyHint" | "slug" | "sortOrder" | "useCase" | "creativeDirection"
> & {
  creativeDirection: Omit<CreativeBrief, "capture"> & { capture?: CreativeBrief["capture"] };
};

const imagePresets = [
  {
    id: "on-model-editorial", title: "On-model Editorial", shortDescription: "Clean premium fashion editorial photograph.", category: "fashion", thumbnail: "/features/templates/fashion-template.webp",
    creativeDirection: {
      subject: "One adult fashion model wearing the supplied garment, with the garment as the clear campaign hero.",
      pose: "A relaxed natural standing editorial pose with open shoulders and no hands obscuring important garment details.",
      environment: "A contemporary architectural editorial setting with restrained materials and no distracting props.",
      composition: "A calm premium magazine composition using medium or full-body framing appropriate to the garment silhouette.",
      camera: "Eye-level fashion photography with a believable 50mm perspective and clean vertical lines.",
      lighting: "Soft directional daylight with gentle shadow definition and accurate garment color.",
      mood: "Refined, contemporary, confident, and quietly premium.",
      realism: "Photorealistic adult anatomy, natural skin texture, realistic fabric weight, folds, and gravity; no AI-art appearance.",
      productTreatment: "Keep the supplied garment fully recognizable, clearly readable, and free from invented styling details.",
      negativeConstraints: "No extra garments, added logos or graphics, distorted hands, text, crowd, or product redesign.",
      capture: getFashionCaptureProfile("natural_editorial_daylight"),
    },
  },
  {
    id: "brutalist-streetwear", title: "Brutalist Streetwear", shortDescription: "Streetwear campaign with modern architectural mood.", category: "fashion", thumbnail: "/workspace-demo/fashion/campaign.webp",
    creativeDirection: {
      subject: "One adult fashion model wearing the supplied streetwear garment, presented as the hero of a premium campaign.",
      pose: "A bold but believable relaxed editorial pose that supports an oversized streetwear silhouette without hiding the garment.",
      environment: "Monumental brutalist concrete architecture with clean planes, structural shadow, and no graffiti unless requested.",
      composition: "Graphic architectural geometry frames the model, with generous negative space and a strong garment-led silhouette.",
      camera: "Slightly low or eye-level fashion camera, medium-full framing, natural perspective, and disciplined straight lines.",
      lighting: "Natural directional daylight with defined but realistic shadows across concrete and fabric.",
      mood: "Modern, assertive, architectural, and premium magazine campaign.",
      realism: "Photorealistic adult anatomy, grounded stance, true fabric volume, natural folds, and believable urban scale.",
      productTreatment: "Preserve the supplied garment exactly and keep its silhouette, color, design, and visible details central.",
      negativeConstraints: "No graffiti, signage, random text, extra graphics, duplicate garments, second model, or AI-art styling.",
      capture: getFashionCaptureProfile("natural_editorial_daylight"),
    },
  },
  {
    id: "urban-night", title: "Urban Night", shortDescription: "Cinematic night streetwear campaign.", category: "fashion", thumbnail: "/workspace-demo/fashion/social.webp",
    creativeDirection: {
      subject: "One adult fashion model wearing the supplied garment in a premium contemporary city streetwear campaign.",
      pose: "A natural relaxed standing editorial pose with the garment unobstructed and the body positioned confidently toward the camera.",
      environment: "A credible contemporary city street, storefront, or architectural facade at night, with subtle wet-ground reflections only when tasteful.",
      composition: "Medium-to-full fashion framing keeps the garment readable while the restrained night environment provides depth and context.",
      camera: "Eye-level 50mm fashion camera with shallow but believable depth of field and natural street-scale perspective.",
      lighting: "Realistic storefront, street, and architectural light shaping the model with accurate skin tones and controlled reflected fill.",
      mood: "Polished nocturnal urban editorial: confident, current, and premium rather than futuristic.",
      realism: "Photorealistic adult anatomy, natural skin tones, believable fabric behavior, grounded shadows, and editorial photography realism.",
      productTreatment: "The supplied garment remains crisp, color-accurate, and visibly dominant as the campaign hero.",
      capture: getFashionCaptureProfile("urban_night_flash"),
      negativeConstraints: "No cyberpunk clichés, neon overload, random signs or text, extra garment graphics, second model, or product redesign.",
    },
  },
  {
    id: "minimal-studio-fashion", title: "Minimal Studio Fashion", shortDescription: "Soft studio setup for clean apparel presentation.", category: "fashion", thumbnail: "/workspace-demo/fashion/product.webp",
    creativeDirection: {
      subject: "One adult model wearing the supplied garment for a clean, product-led studio fashion image.",
      pose: "A simple relaxed editorial pose with arms and hands clear of the garment's important front details.",
      environment: "A seamless neutral studio in warm white, pale gray, or soft stone tones with no unnecessary props.",
      composition: "Balanced medium or full-body framing with ample quiet space and the garment clearly visible.",
      camera: "Eye-level commercial fashion camera with a natural 50mm perspective and accurate proportions.",
      lighting: "Soft large-source studio lighting, natural contact shadows, and gentle tonal separation from the backdrop.",
      mood: "Restrained, polished, calm, and modern.",
      realism: "Photorealistic skin and anatomy with true fabric texture, natural drape, folds, and gravity.",
      productTreatment: "Prioritize garment color, construction, silhouette, and visible artwork without redesigning the supplied product.",
      negativeConstraints: "No busy set, text, extra garments, accessories covering the product, artificial glossy skin, or AI-art look.",
      capture: getFashionCaptureProfile("soft_studio_fashion"),
    },
  },
  {
    id: "back-print-focus", title: "Back Print Focus", shortDescription: "Designed for back-graphic apparel campaigns.", category: "fashion", thumbnail: "/workspace-demo/fashion/fabric-detail.webp",
    creativeDirection: {
      subject: "One adult model wearing the supplied garment with their back facing the camera; the back artwork is the primary visual focus.",
      pose: "A relaxed upright standing pose, slightly offset only if it keeps the full back panel and artwork unobstructed.",
      environment: "A clean contemporary editorial setting with restrained architectural texture and no competing visual elements.",
      composition: "Medium-to-full back framing centered on the garment's rear panel, with the print completely visible and readable.",
      camera: "Eye-level fashion camera with natural perspective and sufficient depth to keep the entire back artwork sharp.",
      lighting: "Soft directional daylight or studio light revealing the garment texture without glare across the print.",
      mood: "Confident, editorial, contemporary, and product-focused.",
      realism: "Photorealistic adult anatomy, natural garment drape, realistic fabric folds, and physically plausible posture.",
      productTreatment: "Preserve the exact back artwork, scale, color, and garment construction; keep hair and accessories away from the print.",
      negativeConstraints: "No front-facing model, no hair or hands covering the artwork, no new print or text, no duplicate garment, or AI-art look.",
      capture: getFashionCaptureProfile("natural_editorial_daylight"),
    },
  },
  {
    id: "front-hero-apparel", title: "Front Hero Apparel", shortDescription: "Front-facing garment-focused model shot.", category: "fashion", thumbnail: "/auth/fashion-dress-campaign.webp",
    creativeDirection: {
      subject: "One adult model wearing the supplied garment, facing the camera with the front design as the campaign hero.",
      pose: "A relaxed premium editorial pose with hands kept clear of the chest and front artwork.",
      environment: "A pared-back contemporary campaign setting that supports the garment without competing for attention.",
      composition: "Medium fashion framing that clearly shows the front silhouette, chest details, and natural garment length.",
      camera: "Eye-level commercial fashion camera with a natural perspective and clean, proportional framing.",
      lighting: "Soft sculpted key light with gentle fill, accurate color, and readable front fabric detail.",
      mood: "Confident, premium, direct, and contemporary.",
      realism: "Photorealistic adult anatomy, natural expression, real fabric folds and weight, and editorial photographic finish.",
      productTreatment: "Keep all supplied front artwork, color, construction, and proportions exact and prominently visible.",
      negativeConstraints: "No hands covering artwork, extra layers, invented graphics or text, duplicate model, distorted anatomy, or product redesign.",
      capture: getFashionCaptureProfile("natural_editorial_daylight"),
    },
  },
  {
    id: "editorial-flash", title: "Editorial Flash", shortDescription: "Raw premium streetwear photography with authentic direct-flash character.", category: "fashion", thumbnail: "/workspace-demo/fashion/social.webp",
    creativeDirection: {
      subject: "One adult fashion model naturally wearing the supplied garment as the clear hero of a real streetwear campaign.",
      pose: "A confident but relaxed candid editorial pose with believable weight distribution and hands clear of important garment details.",
      environment: "An authentic contemporary city street or lived-in urban lifestyle location with real texture and no artificial neon styling.",
      composition: "A slightly imperfect medium-to-full editorial fashion frame that keeps the garment readable while retaining honest location context.",
      camera: "Street-level editorial photography with a natural perspective and an immediate, documentary-adjacent camera presence.",
      lighting: "Direct camera flash crisply defines the model against a visible, slightly darker ambient urban background.",
      mood: "Raw, confident, current, and professionally photographed rather than polished into a studio campaign.",
      realism: "Believable anatomy, natural skin texture, real hair flyaways, grounded posture, and cloth that responds naturally to the worn body.",
      productTreatment: "Keep the supplied garment's identity, silhouette, color, print placement, and distinctive construction exact and clearly visible.",
      negativeConstraints: "No CGI, 3D render, fashion mockup, plastic skin, fake bokeh, glossy synthetic fabric, duplicated body parts, floating clothing, or artificial neon.",
      capture: getFashionCaptureProfile("editorial_flash"),
    },
  },
  {
    id: "coastal-editorial", title: "Coastal Editorial", shortDescription: "Natural coastal streetwear campaign with wind, texture, and real location character.", category: "fashion", thumbnail: "/workspace-demo/fashion/campaign.webp",
    creativeDirection: {
      subject: "One adult fashion model naturally wearing the supplied garment as the central subject of a premium location campaign.",
      pose: "A relaxed standing or walking editorial pose with believable balance, natural wind response, and the garment fully legible.",
      environment: "A rugged coastline, beach edge, or weathered natural setting with real sand, rock, vegetation, or sea texture and no fantasy landscape.",
      composition: "An imperfect but intentional medium-to-full fashion composition that gives the model and natural setting authentic breathing room.",
      camera: "Natural-perspective location fashion photography with a grounded documentary editorial distance and true environmental scale.",
      lighting: "Overcast or late-day directional daylight shapes the model and garment naturally; use only restrained flash if the composition genuinely needs it.",
      mood: "Wind-touched, tactile, confident, and authentic to a real premium streetwear location campaign.",
      realism: "Natural skin, anatomy, wind-affected hair, real environmental texture, and fabric that moves and drapes plausibly in the coastal air.",
      productTreatment: "Preserve the supplied garment's color, silhouette, print placement, and distinctive details while letting fabric move naturally on the body.",
      negativeConstraints: "No fantasy seascape, glossy studio composite, CGI, 3D render, mockup appearance, plastic skin, floating fabric, or cinematic overprocessing.",
      capture: getFashionCaptureProfile("natural_editorial_daylight"),
    },
  },
  {
    id: "luxury-macro-jewelry", title: "Luxury Macro", shortDescription: "Close-up luxury jewelry campaign with rich detail.", category: "jewelry", thumbnail: "/workspace-demo/jewelry/macro.webp",
    creativeDirection: {
      subject: "One supplied jewelry piece in a macro commercial photograph, dominating the frame as the sole hero product.",
      pose: "Still-life placement with the piece naturally supported and its key form, setting, clasp, or gemstone detail clearly visible.",
      environment: "A dark neutral premium background with minimal sculptural support and no unrelated decorative objects.",
      composition: "Tight macro framing emphasizes craftsmanship, material transitions, and the jewelry's true scale.",
      camera: "High-resolution macro product camera with selective but intentional shallow depth of field focused on the hero detail.",
      lighting: "Controlled soft specular highlights that describe metal curvature and gemstones without clipping reflections.",
      mood: "Precise, luxurious, intimate, and quietly dramatic.",
      realism: "Photorealistic metal reflections, gemstone detail when present, accurate edges, and physically plausible shadow falloff.",
      productTreatment: "Preserve exact jewelry geometry, material, stones, scale, and construction; show one product only.",
      negativeConstraints: "No duplicate jewelry, invented stones, altered metal color, floating geometry, text, hands, or synthetic CGI finish.",
    },
  },
  {
    id: "soft-daylight-jewelry", title: "Soft Daylight Jewelry", shortDescription: "Elegant jewelry photography in soft natural light.", category: "jewelry", thumbnail: "/workspace-demo/jewelry/product.webp",
    creativeDirection: {
      subject: "One supplied jewelry product shown as an elegant commercial still life with its material and silhouette clearly legible.",
      pose: "Naturally arranged on a pale tactile surface with a believable resting point and no strained or floating placement.",
      environment: "An airy neutral daylight setting with pale stone, linen, or matte paper texture kept deliberately minimal.",
      composition: "Close product-led framing with generous breathing room and a clear hierarchy around the single jewelry piece.",
      camera: "Close commercial product camera with gentle depth of field and true-to-scale perspective.",
      lighting: "Bright diffused window daylight, soft shadows, and restrained highlights that retain metal and gemstone detail.",
      mood: "Fresh, gentle, airy, and refined.",
      realism: "Photorealistic surface texture, controlled reflections, accurate material behavior, and natural contact shadow.",
      productTreatment: "Preserve the supplied jewelry's geometry, finish, stones, and proportions without adding companion pieces.",
      negativeConstraints: "No dark dramatic backdrop, duplicate jewelry, invented stones, text, heavy retouching, or unrealistic reflections.",
    },
  },
  {
    id: "black-luxury-jewelry", title: "Black Luxury", shortDescription: "Dark premium jewelry campaign with dramatic lighting.", category: "jewelry", thumbnail: "/workspace-demo/jewelry/campaign.webp",
    creativeDirection: {
      subject: "One supplied jewelry product presented as a high-end dark campaign hero, with its silhouette and material clearly defined.",
      pose: "A stable still-life arrangement on a matte black or deep charcoal support with a believable contact point.",
      environment: "A restrained black premium studio with subtle textured surface and no decorative clutter.",
      composition: "Sculptural close framing uses negative space and controlled shadow to isolate the single jewelry piece.",
      camera: "Close commercial camera with crisp hero detail and a measured shallow depth of field.",
      lighting: "Dramatic but controlled key and edge light producing refined metal highlights without blown specular areas.",
      mood: "Rich, composed, nocturnal, and luxurious.",
      realism: "Physically plausible reflections, accurate precious-metal tones, natural shadow density, and high-resolution craft detail.",
      productTreatment: "Keep the exact supplied jewelry design, stones, finish, and scale intact as the sole subject.",
      negativeConstraints: "No duplicate pieces, invented gems, colored neon, random text, floating product, or plastic CGI materials.",
    },
  },
  {
    id: "jewelry-on-model", title: "Jewelry on Model", shortDescription: "Elegant on-model jewelry editorial image.", category: "jewelry", thumbnail: "/workspace-demo/jewelry/campaign-hero.webp",
    creativeDirection: {
      subject: "One adult model naturally wearing the supplied jewelry, with the jewelry clearly visible as the principal hero.",
      pose: "A calm portrait or upper-body pose that presents the jewelry at its natural wearing position without hands covering it.",
      environment: "A quiet premium editorial setting with neutral skin-adjacent tones and unobtrusive wardrobe styling.",
      composition: "Close portrait or upper-body framing gives the jewelry enough scale while retaining natural human context.",
      camera: "Refined portrait camera with believable perspective and focused detail on the jewelry's visible face.",
      lighting: "Soft sculpted portrait light that preserves natural skin texture and controlled jewelry highlights.",
      mood: "Elegant, intimate, modern, and understated.",
      realism: "Photorealistic adult anatomy and skin, believable wearing scale, accurate metal reflections, and true material detail.",
      productTreatment: "Preserve the exact jewelry geometry, stones, and placement; do not replace it with a different accessory.",
      negativeConstraints: "No duplicate jewelry, obscuring hair or hands, invented stones, exaggerated retouching, text, or AI-art look.",
    },
  },
  {
    id: "stone-surface-jewelry", title: "Stone Surface", shortDescription: "Jewelry styled on elegant stone or marble surfaces.", category: "jewelry", thumbnail: "/features/templates/jewelry-template.webp",
    creativeDirection: {
      subject: "One supplied jewelry product styled as a sculptural still life with fine material detail and an accurate scale.",
      pose: "Naturally resting on veined stone or honed marble with a convincing contact shadow and carefully visible profile.",
      environment: "An elegant pale or warm mineral surface with restrained natural texture and no unrelated props.",
      composition: "A deliberate sculptural arrangement, close enough to reveal craftsmanship while retaining serene negative space.",
      camera: "Close product camera with natural perspective and a selective depth of field that keeps the hero form readable.",
      lighting: "Soft side daylight with controlled highlight rolloff across stone, metal, and gemstones.",
      mood: "Tactile, serene, sculptural, and quietly luxurious.",
      realism: "Photorealistic stone grain, metal reflection, gemstone behavior, natural weight, and precise contact shadows.",
      productTreatment: "Preserve the supplied jewelry exactly, including geometry, finish, stones, and material color; present a single product.",
      negativeConstraints: "No duplicate jewelry, invented stones, warped reflections, text, hands, floral clutter, or synthetic CGI appearance.",
    },
  },
  {
    id: "minimal-product-detail", title: "Minimal Detail", shortDescription: "Clean and minimal close-up product presentation.", category: "jewelry", thumbnail: "/workspace-demo/jewelry/social.webp",
    creativeDirection: {
      subject: "One supplied jewelry item in a clean close-up commercial study, with its defining form and finish unobstructed.",
      pose: "A simple stable still-life placement that reveals the most important product-facing detail.",
      environment: "A seamless matte neutral backdrop with no set dressing, texture, or props competing with the jewelry.",
      composition: "Minimal close framing with disciplined negative space and the jewelry held as the only visual focal point.",
      camera: "Precise close product camera with crisp focal detail and a restrained natural depth of field.",
      lighting: "Clean soft studio light with subtle shaping, accurate metal color, and reflection control.",
      mood: "Quiet, modern, exacting, and premium.",
      realism: "Photorealistic material finish, sharp geometry, natural contact shadow, and physically plausible highlights.",
      productTreatment: "Keep the supplied jewelry unchanged and singular, with real scale, edges, stones, and surface detail preserved.",
      negativeConstraints: "No duplicate product, invented gems, text, decorative clutter, distorted geometry, or CGI plastic sheen.",
    },
  },
  {
    id: "dark-premium-studio", title: "Dark Premium Studio", shortDescription: "High-end studio product campaign with dark premium mood.", category: "product", thumbnail: "/features/templates/cosmetics-template.webp",
    creativeDirection: {
      subject: "One supplied product presented as the hero of a refined dark premium studio campaign.",
      pose: "A stable upright or naturally supported product placement that clearly reveals the front-facing product identity.",
      environment: "A dark graphite, charcoal, or deep neutral studio stage with a refined matte or lightly textured surface.",
      composition: "Strong centered or slightly asymmetric hero composition with deliberate negative space around the single product.",
      camera: "Commercial product camera at a natural hero angle with clean perspective and full product readability.",
      lighting: "Controlled directional key light with soft fill and a restrained rim light, plus a realistic contact shadow.",
      mood: "Sophisticated, focused, rich, and premium.",
      realism: "Photorealistic materials, accurate surface texture, physically plausible reflections, and grounded product scale.",
      productTreatment: "Preserve the exact supplied product geometry, packaging, labels, color, and finish as the sole hero object.",
      negativeConstraints: "No duplicate product, random props, text overlays, hands, excessive fog, neon, or product redesign.",
    },
  },
  {
    id: "soft-daylight-product", title: "Soft Daylight Product", shortDescription: "Bright natural commercial product photography.", category: "product", thumbnail: "/workspace-demo/cosmetics/product.webp",
    creativeDirection: {
      subject: "One supplied product photographed as a bright, approachable commercial hero with all key details clearly visible.",
      pose: "A natural upright or carefully supported placement with a believable contact point and no hands.",
      environment: "An airy sunlit setting with pale stone, soft plaster, or matte neutral surface and restrained natural texture.",
      composition: "Clean hero product composition with breathing room, a stable horizon, and no secondary product competing for attention.",
      camera: "Natural commercial product camera angle with accurate perspective and enough depth for the complete product to read.",
      lighting: "Bright diffused daylight with soft directional shadow, gentle reflected fill, and realistic surface highlights.",
      mood: "Fresh, natural, optimistic, and polished.",
      realism: "Photorealistic materials, true product color, plausible daylight reflection, and a grounded contact shadow.",
      productTreatment: "Keep the supplied product exact, singular, and immediately recognizable without altering labels or packaging.",
      negativeConstraints: "No dark moody treatment, duplicate product, text overlay, hands, clutter, surreal props, or altered packaging.",
    },
  },
  {
    id: "tabletop-lifestyle", title: "Tabletop Lifestyle", shortDescription: "Styled product placed naturally in a tasteful setting.", category: "product", thumbnail: "/workspace-demo/cosmetics/campaign.webp",
    creativeDirection: {
      subject: "One supplied product staged as the hero of a tasteful, lived-in tabletop lifestyle campaign.",
      pose: "A naturally placed product on a table or counter, grounded by a precise contact shadow and not held by a hand.",
      environment: "A warm, considered domestic or hospitality-inspired tabletop setting with a small number of relevant supporting textures.",
      composition: "Product-first still life composition, with supporting objects pushed to the background and ample visual clarity around the hero.",
      camera: "Commercial tabletop camera at a believable slightly elevated angle with natural perspective.",
      lighting: "Soft directional daylight or warm practical light with gentle shadows and controlled reflections.",
      mood: "Inviting, tactile, polished, and believable.",
      realism: "Photorealistic scale, materials, contact shadows, and spatial relationships with no floating or warped objects.",
      productTreatment: "Preserve the supplied product's exact shape, packaging, label, color, and proportions as the only product instance.",
      negativeConstraints: "No duplicate product, random clutter, text overlay, hands, unrelated food, surreal props, or packaging redesign.",
    },
  },
  {
    id: "reflective-luxury-surface", title: "Reflective Luxury", shortDescription: "Elegant luxury product scene with controlled reflections.", category: "product", thumbnail: "/features/image-and-video/campaign-visual.webp",
    creativeDirection: {
      subject: "One supplied product as a polished luxury campaign hero on a refined reflective surface.",
      pose: "A stable product placement with a physically plausible partial reflection and clear front-facing product detail.",
      environment: "A restrained premium studio with smoked glass, polished stone, or dark reflective material and no excess set dressing.",
      composition: "Sculptural hero composition uses reflection as a secondary accent while the real product remains unmistakably dominant.",
      camera: "Commercial product camera at a low-to-eye-level hero angle with precise perspective control.",
      lighting: "Controlled key and edge lighting creates elegant highlight lines and a subtle truthful reflection without glare.",
      mood: "Elegant, precise, luxurious, and composed.",
      realism: "Photorealistic reflected geometry, material response, contact shadow, and product scale with no mirror distortions.",
      productTreatment: "Keep the supplied product exact and singular; reflections must not read as an extra physical product.",
      negativeConstraints: "No duplicate product, impossible reflection, random luxury props, text, hands, neon, or altered packaging.",
    },
  },
  {
    id: "minimal-catalog-plus", title: "Minimal Commercial", shortDescription: "Clean commercial product shot with premium polish.", category: "product", thumbnail: "/features/product-fidelity/generated-scene.webp",
    creativeDirection: {
      subject: "One supplied product in a polished minimal commercial hero image with all product-facing details easy to inspect.",
      pose: "A centered upright or naturally supported placement with stable contact shadow and no human interaction.",
      environment: "A seamless light neutral or subtle gradient studio backdrop with no props or background distraction.",
      composition: "Clean elevated catalog composition with balanced margins, clear silhouette, and an immediately readable product hierarchy.",
      camera: "Straight-on or slight three-quarter commercial camera with accurate proportions and full product focus.",
      lighting: "Soft even studio light with refined shaping, true color, and a restrained realistic shadow beneath the product.",
      mood: "Clear, modern, trustworthy, and premium.",
      realism: "Photorealistic packaging, material finish, label detail, surface response, and natural product scale.",
      productTreatment: "Preserve the exact supplied product, including all packaging, logo, typography, color, and geometry; show one product only.",
      negativeConstraints: "No duplicate item, hands, text overlays, busy styling, floating product, distorted labels, or redesign.",
    },
  },
  {
    id: "tech-launch-hero", title: "Tech Launch Hero", shortDescription: "Flagship technology campaign image with refined drama.", category: "product", thumbnail: "/features/image-and-video/vertical-social.webp",
    creativeDirection: {
      subject: "One supplied technology product presented as the exact flagship hero of a premium launch campaign.",
      pose: "A stable hero placement on a sculpted refined stage or table surface, with the product's key face clearly readable.",
      environment: "A minimal dark graphite or neutral premium technology stage with clean surfaces and no futuristic clutter.",
      composition: "A decisive campaign hero composition isolates the single product with sculptural depth and purposeful negative space.",
      camera: "Commercial product camera at a confident low three-quarter or eye-level hero angle with precise perspective.",
      lighting: "Controlled low-key key light and narrow rim light with realistic contact shadow and subtle physically plausible reflection.",
      mood: "Flagship, refined, modern, and quietly dramatic.",
      realism: "Photorealistic materials, exact physical proportions, controlled reflections, and believable launch-photography finish.",
      productTreatment: "Preserve the supplied product's exact geometry, labels, typography, material, color, and design; show one hero product only.",
      negativeConstraints: "No text overlay, hands, duplicate product, random futuristic clutter, cyberpunk effects, neon overload, or product redesign.",
    },
  },
] as const satisfies readonly CreativePresetDefinition[];

const generationStrategyHints: Record<string, GenerationStrategy> = {
  "on-model-editorial": "fashion_on_model",
  "brutalist-streetwear": "fashion_on_model",
  "urban-night": "fashion_on_model",
  "minimal-studio-fashion": "fashion_on_model",
  "back-print-focus": "fashion_on_model",
  "front-hero-apparel": "fashion_on_model",
  "editorial-flash": "fashion_on_model",
  "coastal-editorial": "fashion_on_model",
  "luxury-macro-jewelry": "jewelry_still_life",
  "soft-daylight-jewelry": "jewelry_still_life",
  "black-luxury-jewelry": "jewelry_still_life",
  "jewelry-on-model": "jewelry_on_model",
  "stone-surface-jewelry": "jewelry_still_life",
  "minimal-product-detail": "jewelry_still_life",
  "dark-premium-studio": "rigid_product",
  "soft-daylight-product": "rigid_product",
  "tabletop-lifestyle": "rigid_product",
  "reflective-luxury-surface": "rigid_product",
  "minimal-catalog-plus": "rigid_product",
  "tech-launch-hero": "rigid_product",
};

export const creativePresets: readonly CreativePreset[] = imagePresets.map((preset, index) => ({
  ...preset,
  creativeDirection: {
    ...preset.creativeDirection,
    capture: "capture" in preset.creativeDirection ? preset.creativeDirection.capture ?? null : null,
  },
  slug: preset.id,
  generationMode: "image",
  generationStrategyHint: generationStrategyHints[preset.id] ?? "rigid_product",
  useCase: preset.category,
  sortOrder: index + 1,
  enabled: true,
}));

export function getCreativePreset(id: unknown): CreativePreset | null {
  if (typeof id !== "string") return null;
  return creativePresets.find((preset) => preset.enabled && preset.id === id) ?? null;
}
