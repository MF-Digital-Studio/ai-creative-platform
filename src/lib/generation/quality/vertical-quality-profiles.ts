import type { SupportedVertical } from "@/lib/verticals/supported-verticals";

export type VerticalPresentationMode = "on_model" | "still_life";

export type VerticalQualityProfile = {
  vertical: SupportedVertical;
  fidelityInvariants: string;
  identityPriorities: string;
  allowedTransformations: string;
  realismRules: string;
  materialRules: string;
  onModelRules: string;
  stillLifeRules: string;
  onModelCompositionPolicy: string;
  stillLifeCompositionPolicy: string;
  artifactPrevention: string;
};

export const verticalQualityProfiles: Record<SupportedVertical, VerticalQualityProfile> = {
  apparel: {
    vertical: "apparel",
    fidelityInvariants: "Preserve garment type, silhouette, hood or collar, sleeve and cuff construction, hem, closures, pockets, visible seams, color blocking, fabric appearance, logos, artwork, print placement and front/back distinction.",
    identityPriorities: "Identity-critical regions: visible logo, artwork, print typography, zipper or buttons, pockets, and front/back graphics.",
    allowedTransformations: "Allow only natural body-fit transformations: perspective, drape, folds, sleeve bending, fabric tension, compression, and requested wind movement. Geometry may deform naturally; identity may not change.",
    realismRules: "Use believable shoulders, neck-to-hood interaction, sleeves aligned to arms, natural hands, visible skin pores and microtexture, natural hair, posture, and weight distribution.",
    materialRules: "Show fabric weight, weave, natural drape, folds, and gravity consistent with the supplied garment.",
    onModelRules: "Integrate the garment as physically worn; keep artwork on its correct panel and never mirror or relocate it.",
    stillLifeRules: "Keep the garment controlled, fully recognizable, and structurally intact in its resting presentation.",
    onModelCompositionPolicy: "Keep the garment fully readable in a model-led editorial frame; do not crop away the identity-critical panel.",
    stillLifeCompositionPolicy: "Keep the garment as the single readable hero with its defining panel and construction visible.",
    artifactPrevention: "No added graphics or logos, mirrored print, changed closures or pockets, fused garment/body, mannequin posture, or floating fabric.",
  },
  jewelry: {
    vertical: "jewelry",
    fidelityInvariants: "Preserve the exact jewelry design: jewelry type, geometry, proportions, metal color and thickness, band or chain construction, every visible gemstone count and placement, center-stone form and cut, prongs and setting structure, pendant shape, earring and bracelet form, clasp details, original symmetry or asymmetry, and all distinctive design details.",
    identityPriorities: "Identity-critical regions: every visible gemstone and its placement, center stone form and cut, prongs or setting structure, ring band geometry, pendant and chain construction, earring attachment, bracelet closure, clasp, and the original proportions and symmetry.",
    allowedTransformations: "Allow only truthful camera perspective, natural orientation, and physically plausible body-aligned placement. Do not resize the jewelry disproportionately, warp its geometry, alter its metal form, or reinterpret its design.",
    realismRules: "Use true-to-scale photography at luxury commercial quality with natural skin contact and contact shadows, controlled highlights, restrained sparkle, and physically plausible reflection logic. Never create floating gaps, pasted placement, skin-embedded metal, warped geometry, low-detail generic jewelry, or a CGI appearance.",
    materialRules: "Render gold, silver, rose gold, platinum, and other supplied metal finishes with physically plausible metal reflections, roughness, and premium surface detail. Render every gemstone as a distinct stone with readable cut, setting, and restrained transparent or translucent internal reflection; never use plastic, glass-bead, chrome, melted, or fantasy-glow materials.",
    onModelRules: "The jewelry must be worn naturally and physically correctly. For rings, fit the complete band precisely around one anatomically plausible finger with aligned perspective, visible setting detail, believable skin contact, and a subtle contact shadow—never a gap or skin intersection. For necklaces, let the chain follow neck and collarbone curvature, gravity, tension, and pendant contact. For bracelets, wrap or drape naturally around the wrist with credible tension and contact. For earrings, attach at a believable ear point and let dangling parts follow gravity. Keep hands, fingers, wrists, necks, and ears anatomically natural and never paste or overlay the jewelry onto skin.",
    stillLifeRules: "Keep the exact geometry, components, stone count, setting detail, and premium material behavior strict in a supported still-life arrangement with physically plausible contact; no body, floating product, or decorative prop may obscure the jewelry's full readable form.",
    onModelCompositionPolicy: "Make the jewelry the large, sharply readable hero in a tight luxury editorial crop: use a macro hand close-up for rings, neck or collarbone close-up for necklaces, wrist close-up for bracelets, and ear or portrait crop for earrings. Keep body context supporting and never let the jewelry become small, distant, or unfocused.",
    stillLifeCompositionPolicy: "Use a close product-first luxury still life with the full jewelry form, every identity-critical stone or setting, and premium material detail clearly readable; the supporting surface or aesthetic setting must remain secondary.",
    artifactPrevention: "No extra or missing stones, incorrect stone placement, altered center-stone cut, warped prongs or settings, distorted ring band, invented ornaments, changed metal color, melted or plastic metal, redesigned pendant, merged components, broken anatomy, detached shadow logic, oversized or undersized body scale, floating jewelry, pasted-on appearance, AI-art, or CGI look.",
  },
  watches: {
    vertical: "watches",
    fidelityInvariants: "Preserve case shape and proportions, bezel structure, crown side, lugs, dial layout, exact marker count, hand placement style, visible subdials, date-window position, strap or bracelet type and link structure, material, color, and visible logo or text layout.",
    identityPriorities: "Identity-critical regions: dial geometry, marker count and positions, hand configuration, visible subdial and date-window positions, bezel markings, crown side, lugs, pushers, and bracelet construction. Preserve visual layout when microtext is unclear; use a clean believable dial rather than invented or nonsense text.",
    allowedTransformations: "Allow natural wrist rotation, perspective, and strap or bracelet curvature only; do not alter timepiece construction.",
    realismRules: "Use accurate wrist scale, plausible orientation and fit, natural skin contact, controlled metal and crystal reflections, and a watch that neither floats nor sinks into skin.",
    materialRules: "Render glass, brushed or polished metal, and strap materials with physically plausible reflections and surface finish.",
    onModelRules: "Curve the strap or bracelet naturally around the wrist with believable tension, skin contact, and a correctly placed crown; preserve the readable dial without warping it.",
    stillLifeRules: "Keep dial, bezel, crown, bracelet, and case geometry rigid and fully readable in the product presentation.",
    onModelCompositionPolicy: "Use a close wrist-led editorial frame where the watch remains large, readable, and clearly fitted to the wrist.",
    stillLifeCompositionPolicy: "Use a close product-first composition that keeps the case, crown side, dial, and bracelet or strap construction readable.",
    artifactPrevention: "No extra crowns or pushers, missing crown detail, rearranged markers or subdials, nonsense dial typography, altered bezel geometry, malformed bracelet, warped dial, altered case proportions, or sticker-like wrist placement.",
  },
  cosmetics: {
    vertical: "cosmetics",
    fidelityInvariants: "Preserve bottle, jar, or tube geometry; cap, pump, or dropper; label and logo placement; dominant typography layout; package color; transparency; visible fill level; finish; and distinctive packaging details.",
    identityPriorities: "Identity-critical regions: label, logo layout, cap or pump, dispenser, bottle silhouette, and visible fill line.",
    allowedTransformations: "Allow only camera perspective and physically plausible reflections; packaging identity and proportions remain fixed.",
    realismRules: "Use clean contact shadows, controlled highlights, physically plausible surface reflections, and moisture or condensation only when requested.",
    materialRules: "Render glass refraction, frosted diffusion, plastic roughness, metal reflection, liquid translucency, and labels following package curvature.",
    onModelRules: "Keep packaging rigid and naturally held only when the direction explicitly requires human interaction.",
    stillLifeRules: "Keep packaging grounded, singular, and physically supported in premium commercial lighting.",
    onModelCompositionPolicy: "Keep the packaging dominant and fully readable whenever human interaction is explicitly requested.",
    stillLifeCompositionPolicy: "Keep the package as the single clearly readable hero in a clean product-first composition.",
    artifactPrevention: "No redesigned label, invented brand text, changed cap or pump, altered proportions, extra dispenser, fake glass glow, floating packaging, or CGI gloss.",
  },
  footwear: {
    vertical: "footwear",
    fidelityInvariants: "Preserve shoe category, silhouette, toe box, outsole and midsole geometry, heel structure, lacing system, eyelets, tongue, logo placement, color blocking, panel arrangement, and material identity.",
    identityPriorities: "Identity-critical regions: outsole, lacing and eyelet layout, logo, toe box, panel geometry, heel, and color blocking.",
    allowedTransformations: "Allow perspective, slight sole flex, natural upper creasing, and foot-dependent shape change only; keep the shoe identity intact.",
    realismRules: "Use believable left/right orientation, foot and ankle anatomy, realistic scale, natural floor contact, and appropriate cast and contact shadows; do not let generic fashion posing obscure the footwear.",
    materialRules: "Render leather, textile, rubber, stitching, laces, and sole construction with truthful texture and response.",
    onModelRules: "Fit the shoe naturally to the foot with credible ankle alignment and walking or standing weight distribution.",
    stillLifeRules: "Keep the shoe rigid, supported, and fully readable with accurate outsole and upper geometry.",
    onModelCompositionPolicy: "Make the shoes the hero: use low-angle, mid-low-angle, or shoe-forward lower-body framing; keep both shoes large and readable, and never let face or torso dominate unless explicitly requested.",
    stillLifeCompositionPolicy: "Make the shoe the dominant close hero with its outsole, laces, panel lines, color blocking, shape, and logo placement clearly readable.",
    artifactPrevention: "No altered sole, extra panels or colors, changed top height, dramatically altered lace count, floating feet, broken ankles, pasted shoes, or duplicated asymmetric branding.",
  },
};

export function getVerticalQualityProfile(vertical: SupportedVertical): VerticalQualityProfile {
  return verticalQualityProfiles[vertical];
}

export function getVerticalPresentationMode(strategy: string): VerticalPresentationMode {
  return strategy === "fashion_on_model" || strategy === "jewelry_on_model" || strategy === "watch_on_wrist" || strategy === "footwear_on_model"
    ? "on_model"
    : "still_life";
}
