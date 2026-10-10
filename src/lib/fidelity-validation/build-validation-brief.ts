import type { ProductProfile } from "@/lib/product-understanding/product-profile";
import type { CreativeComplianceResolution } from "@/lib/creative-direction-compliance/types";
import type { FidelityValidationBrief } from "./types";
import { FIDELITY_VALIDATION_VERSION } from "./validation-version";
import type { ReferenceMatchResolution } from "@/lib/generation/references/resolve-reference-match";
import type { ProductIdentityManifest } from "@/lib/product-identity/types";
import { getPresetFamily } from "@/lib/creative-presets/creative-presets";
import { resolveFootwearAnatomyPolicy } from "@/lib/footwear/footwear-anatomy-policy";

const verticalChecks: Record<ProductProfile["vertical"], string[]> = {
  jewelry: ["jewelry type, metal, center stone shape/color, stone count/layout, setting, band or chain", "no duplicate or floating jewelry", "natural contact with the resolved body target"],
  watches: ["case, dial layout, bezel, crown, pushers, strap/bracelet, indices, date window, subdials", "do not fail solely for tiny unreadable microtext"],
  footwear: ["silhouette, outsole/midsole, upper panels, laces, tongue, heel, logo, color blocking", "natural scale and ground/foot contact when applicable"],
  apparel: ["garment type, silhouette, color, artwork/logo placement, pockets, closures, hood/collar, construction", "allow natural folds, perspective and body fitting"],
  cosmetics: ["container geometry, cap/pump/dropper, opacity, label/logo placement, liquid/material, dominant colors", "preserve package identity over styling"],
  bags: ["bag type, silhouette, body proportions, handle count/geometry, strap presence/placement, closure/flap, zipper and pocket layout, seams/panels, hardware positions/color, logo/monogram, print, color, and material", "allow only natural leather deformation, soft-bag compression, strap bend, perspective, and lighting reflections; validate believable grip, gravity, shoulder/crossbody contact, and strap tension"],
};
const genericChecks = ["overall product silhouette, proportions, dominant colors, material appearance, branding/artwork, structural integrity", "do not fail for harmless perspective or lighting changes"];

export function buildValidationBrief(input: Parameters<typeof buildBrief>[0] & { referencePreservation?: boolean }): FidelityValidationBrief {
  return buildBrief(input);
}

function buildBrief(input: {
  productProfile: ProductProfile | null;
  vertical: FidelityValidationBrief["vertical"];
  strategy: FidelityValidationBrief["strategy"];
  sceneSuitability: FidelityValidationBrief["sceneSuitability"];
  composition: FidelityValidationBrief["composition"];
  creativeCompliance: CreativeComplianceResolution | null;
  referenceStyleContext?: string | null;
  referenceMatch?: ReferenceMatchResolution | null;
  identityManifest?: ProductIdentityManifest | null;
  apparelArtworkIdentity?: FidelityValidationBrief["apparelArtworkIdentity"];
  referencePreservation?: boolean;
  humanRealism?: FidelityValidationBrief["humanRealism"];
  apparelFit?: FidelityValidationBrief["apparelFit"];
  preset?: FidelityValidationBrief["preset"];
  productImageCount?: number;
  variationHistory?: FidelityValidationBrief["variationHistory"];
}): FidelityValidationBrief {
  return {
    vertical: input.vertical,
    strategy: input.strategy,
    humanRealism: input.humanRealism,
    apparelFit: input.apparelFit,
    footwearAnatomyRequired: resolveFootwearAnatomyPolicy({ vertical: input.vertical, productProfile: input.productProfile }).applies,
    sourceAuthority: input.productImageCount && input.productImageCount > 1
      ? `The ${input.productImageCount} product images show the same physical product from different viewpoints and collectively form source truth for one single product. Image 1 is primary authority for silhouette, main color, overall form, and proportions. Supporting product views are additional authority for shape, material, hardware, handles/straps, pattern, branding placement, and visible construction. Never interpret them as separate products or accept a blended/different SKU. ProductProfile is advisory and cannot override visible multi-view evidence.`
      : "The original product image is pixel truth. ProductProfile is an interpretation aid and cannot override visible source evidence.",
    productImageCount: input.productImageCount ?? 1,
    referencePreservation: input.referencePreservation === true,
    presetOverrideReason: input.referencePreservation === true ? "reference_authority" : null,
    productProfile: input.productProfile,
    sceneSuitability: input.sceneSuitability,
    composition: input.composition,
    appliedRequirements: input.creativeCompliance?.applied ?? [],
    allowedTransformations: input.productProfile?.allowedTransformations ?? ["perspective_change", "lighting_or_reflection_change"],
    verticalChecks: input.vertical === "product" ? genericChecks : verticalChecks[input.vertical],
    referenceMatch: input.referenceMatch ?? null,
    identityManifest: input.identityManifest ?? null,
    apparelArtworkIdentity: input.apparelArtworkIdentity ?? null,
    preset: input.preset ? {
      ...input.preset,
      ...(() => {
        const family = getPresetFamily(input.preset.familyId);
        return family ? { vertical: family.vertical, allowedSceneTypes: family.allowedSceneTypes, disallowedSceneTypes: family.disallowedSceneTypes, hardRules: family.hardRules, softRules: family.softRules } : {};
      })(),
    } : null,
    variationHistory: input.variationHistory ?? null,
  };
}

export function renderValidationInstructions(brief: FidelityValidationBrief): string {
  return [
    `You are the semantic post-generation quality gate. Validation version: ${FIDELITY_VALIDATION_VERSION}.`,
    brief.sourceAuthority,
    "Answer: is this still clearly the same product and commercially usable? The source image remains authoritative. Do not demand pixel, angle, or placement identity. Report only material differences that change product identity or make the image unusable.",
    "Each finding must include confidence from 0 to 1, severity, region, repairable, commercialImpact (none/low/medium/high), identityImpact, and likelyCause. Low confidence must not receive critical severity. Keep human_realism separate from product_identity.",
    "Use PRODUCT_IDENTITY_DRIFT for a substituted/different source design (critical at high confidence). For jewelry use CENTER_STONE_SHAPE_CHANGED, STONE_COUNT_CHANGED, STONE_LAYOUT_CHANGED, SETTING_CHANGED, or BAND_GEOMETRY_CHANGED for true structural changes. For watches use WATCH_DIAL_STRUCTURE_CHANGED; footwear FOOTWEAR_PANEL_STRUCTURE_CHANGED; cosmetics PACKAGE_GEOMETRY_CHANGED; apparel GARMENT_ARTWORK_CHANGED. Critical means confident identity change, major means material but potentially recognizable drift, minor means tolerable variation.",
    brief.vertical === "apparel" ? "Apparel calibration: separate small chest logos from large front/back artwork. For a small logo, check logo identity, garment side and scale class; tolerate limited perspective and position movement without pixel coordinates. For large artwork, be stricter about overall composition, typography, major illustration structure, placement and scale. Wrong/missing artwork, materially changed or unreadable wording, changed garment type/color, major repositioning that changes SKU are critical. Recognizable but materially distorted typography, significant illustration proportion or placement/scale drift are major. Small pose-driven shift, slight scale change, fabric folds, local spacing and lighting color/contrast variation are minor." : "",
    brief.preset?.strictProductOnlyStudio ? "BINDING PRODUCT-ONLY STUDIO VALIDATION: The selected presentation mode requires a human-free Apparel Studio product image. If any person, model, skin, hand, foot, face, mannequin/body part, on-model interaction, street, city, sidewalk, outdoor area, cafe, terrace, exterior, architecture, or lifestyle scene appears, report the applicable high-confidence critical code: PRESET_SCENE_MISMATCH, PRESET_PRESENTATION_MODE_MISMATCH, PRODUCT_ONLY_MODE_HUMAN_LEAK, or PRODUCT_ONLY_MODE_ENVIRONMENT_LEAK. Do not let reference-scene preservation excuse these violations." : "",
    brief.vertical === "jewelry" ? "Jewelry calibration: remain strict on stone count, center stone shape, setting/prongs, band geometry, metal color and pendant silhouette. Allow viewing angle, natural chain curvature/fall, skin contact and perspective-driven apparent scale." : "",
    brief.vertical === "jewelry" && brief.referencePreservation ? "JEWELRY REFERENCE FIDELITY V2: Compare the complete source-product image set directly with the final generated output. Never use jewelry in the scene reference as an identity target. For rings, inspect source center stone shape/count/scale, prong count/placement, setting type/geometry, halo presence, side-stone presence/count/arrangement, band silhouette/profile/width class, metal color, and overall proportions. Report high-confidence material identity changes as critical product_identity findings, using JEWELRY_PRODUCT_SUBSTITUTION, JEWELRY_CENTER_STONE_SHAPE_DRIFT, JEWELRY_CENTER_STONE_COUNT_DRIFT, JEWELRY_PRONG_COUNT_DRIFT, JEWELRY_SETTING_GEOMETRY_DRIFT, JEWELRY_HALO_STRUCTURE_DRIFT, JEWELRY_SIDE_STONE_DRIFT, JEWELRY_BAND_GEOMETRY_DRIFT, JEWELRY_METAL_COLOR_DRIFT, or JEWELRY_REFERENCE_PRODUCT_CONTAMINATION as applicable. Allow perspective-induced apparent width, reflection, contact compression, and tiny optical scale differences. Keep reference composition and Human Realism checks independent." : "",
    brief.vertical === "watches" ? "Watch calibration: remain strict on dial color/layout/indices/hands, bezel, crown, case proportions and strap/bracelet design. Allow wrist angle, perspective scale, realistic compression/contact and lighting-driven metal reflections." : "",
    brief.vertical === "footwear" ? "Footwear calibration: remain strict on silhouette, sole, major panel layout, laces/closure, logo placement and color blocking. Allow foot angle, perspective, sole compression, creases/flex, and minor shadow/color variation." : "",
    brief.footwearAnatomyRequired ? "OPEN-TOE FOOTWEAR HARD GATE: Inspect every visible foot and toe. Each visible foot must have exactly five anatomically correct toes with realistic proportions and natural spacing. Toes must align naturally with the straps, sole/footbed, and pose. Missing, malformed, merged, duplicated, cropped, or misaligned toes must be reported as FOOT_ANATOMY_ERROR or VISIBLE_TOE_COUNT_ERROR; implausible strap/sole/foot fit must be FOOTWEAR_FIT_MISMATCH. These are critical human_realism failures and are never warnings. Apply this only when open-toe footwear and a visible foot/toes are present; do not apply it to closed-toe footwear or product-only images without a visible foot." : "",
    brief.vertical === "cosmetics" ? "Cosmetics calibration: remain strict on package silhouette, cap/pump/applicator, label identity, major text, material/color and proportions. Allow reflections, condensation, hand grip, perspective and mild label curvature." : "",
    brief.vertical === "bags" ? "Bag fidelity path: compare source and output directly. Use BAG_PRODUCT_SUBSTITUTION, BAG_SILHOUETTE_DRIFT, BAG_PROPORTION_DRIFT, BAG_HANDLE_COUNT_DRIFT, BAG_HANDLE_GEOMETRY_DRIFT, BAG_STRAP_DRIFT, BAG_CLOSURE_DRIFT, BAG_FLAP_GEOMETRY_DRIFT, BAG_ZIPPER_LAYOUT_DRIFT, BAG_POCKET_LAYOUT_DRIFT, BAG_PANEL_SEAM_DRIFT, BAG_HARDWARE_DRIFT, BAG_LOGO_MONOGRAM_DRIFT, BAG_PATTERN_DRIFT, BAG_COLOR_DRIFT, BAG_MATERIAL_DRIFT, BAG_CONTACT_IMPLAUSIBLE, or BAG_REFERENCE_PRODUCT_CONTAMINATION. Fail high-confidence substitution, wrong silhouette/handle count/strap system/closure/logo/hardware/color, or missing major construction. Treat meaningful geometry/layout drift as major. Natural leather deformation, soft-bag compression, strap bend, perspective width variation, and small reflection changes are minor and must not fail identity. A reference bag never overrides source identity; Reference 1 still controls transferable pose and framing." : "",
    !brief.referencePreservation && brief.vertical === "bags" && brief.strategy !== "bags_on_model" && brief.preset?.familyId === "bags-studio" ? "Bag Studio compliance gate: the selected preset is product-only studio photography. If the output clearly shows any person, hand, worn bag, body contact, carry interaction, or lifestyle environment, report BAG_PRESET_SCENE_MISMATCH as a critical composition_visibility finding with high confidence. This is preset compliance, not product identity drift. Do not report this for a non-human support, prop, pedestal, or realistic product shadow." : "",
    !brief.referencePreservation && brief.vertical === "bags" && brief.strategy !== "bags_on_model" && brief.preset?.familyId === "bags-lifestyle" ? "Bag Aesthetic Environment compliance gate: the selected preset is product-only lifestyle placement. If the output clearly shows any person, hand, worn bag, body contact, or carry interaction, report BAG_PRESET_SCENE_MISMATCH as a critical composition_visibility finding with high confidence. This is preset compliance, not product identity drift. Do not report this for a non-human environmental support or prop." : "",
    brief.preset && brief.referencePreservation ? `PRESET OVERRIDE (reference_authority): Reference 1 legitimately overrides preset scene, interaction, composition, pose, camera, and framing dimensions. Do not report PRESET_SCENE_MISMATCH, PRESET_INTERACTION_MISMATCH, PRESET_ENVIRONMENT_TOO_GENERIC, or BAG_PRESET_SCENE_MISMATCH for a difference caused by Reference 1. Validate source product identity independently. The preset remains supporting guidance only for unspecified aesthetic dimensions.` : brief.preset ? `PRESET FAMILY COMPLIANCE (${brief.preset.familyId}): allowed scene types: ${(brief.preset.allowedSceneTypes ?? []).join(", ")}. Disallowed scene types: ${(brief.preset.disallowedSceneTypes ?? []).join(", ") || "none"}. Hard rules: ${(brief.preset.hardRules ?? []).join(" ")} Soft rules: ${(brief.preset.softRules ?? []).join(" ")} Selected variant: ${brief.preset.variantId ?? "unspecified"}. If a disallowed scene or missing required interaction/environment is clearly visible, report PRESET_SCENE_MISMATCH or PRESET_INTERACTION_MISMATCH as critical composition_visibility with confidence >= 0.8. If an urban preset has no recognizable street context, report PRESET_ENVIRONMENT_TOO_GENERIC as major. ${brief.variationHistory?.repeatedSceneCount && brief.variationHistory.repeatedSceneCount >= 3 ? "Recent output history shows repeated scene outcomes; report PRESET_VARIATION_COLLAPSE as major only if the current image visibly repeats the same scene and composition." : "Do not report PRESET_VARIATION_COLLAPSE without repeated outcomes in history."} Do not confuse product identity with preset compliance.` : "",
    "Ignore harmless perspective, lighting, natural folds, expected body fitting, and tiny unreadable text unless prominent branding or layout is materially corrupted.",
    brief.vertical === "apparel" ? `Apparel source identity gate: compare the garment against the uploaded product before judging scene quality. Compare artwork composition, typography, major illustration shapes, dominant graphic colors, relative placement, scale and orientation. Report APPAREL_ARTWORK_IDENTITY_DRIFT as critical for materially different/replaced artwork; APPAREL_ARTWORK_TEXT_DRIFT as critical for materially changed text; APPAREL_ARTWORK_STRUCTURE_DRIFT as major for missing/changed major graphic elements; APPAREL_ARTWORK_PLACEMENT_DRIFT, APPAREL_ARTWORK_SCALE_DRIFT, or APPAREL_ARTWORK_COLOR_DRIFT as major for material changes. Small fold-related deviations are minor. Artwork identity evidence: ${brief.apparelArtworkIdentity ? JSON.stringify(brief.apparelArtworkIdentity) : "no separate crop available; do not claim exact artwork verification"}. Visible text is identity-critical. Reference images may guide pose/environment/light/crop only and must never override garment or artwork identity, placement, scale, color, text, or construction.` : "",
    "Validate only creative requirements listed as applied. Rejected or adjusted requirements are not failures. Preferred/decorative misses are warnings.",
    `Vertical-specific checks: ${brief.verticalChecks.join("; ")}.`,
    brief.humanRealism?.applied ? `HUMAN REALISM V2: Independently inspect only visible regions (focus: ${brief.humanRealism.focusAreas.join(", ")}). Normalize findings to HUMAN_FACE_ANATOMY_ERROR, HUMAN_FACE_UNCANNY, HUMAN_EXPRESSION_UNNATURAL, HUMAN_EYE_REALISM_ERROR, HUMAN_SKIN_PLASTIC, HUMAN_SKIN_OVERRETOUCHED, HUMAN_TEXTURE_UNREALISTIC, HUMAN_HAIR_SYNTHETIC, HUMAN_HAND_ANATOMY_ERROR, VISIBLE_FINGER_COUNT_ERROR, FOOT_ANATOMY_ERROR, VISIBLE_TOE_COUNT_ERROR, FOOTWEAR_FIT_MISMATCH, HUMAN_LIMB_ANATOMY_ERROR, BODY_PROPORTION_ERROR, HUMAN_POSTURE_UNNATURAL, or BODY_PRODUCT_INTERACTION_ERROR. High-confidence malformed visible hands/feet, clearly wrong visible digit counts, severe face distortion, duplicated/missing limbs, impossible major joints/proportions, and major body/product penetration are critical. Strong mannequin appearance, plastic/waxy skin, synthetic hair, dead expression, and highly unnatural posture are major. Evaluate apparel drape/openings, bag grip and straps, jewelry attachment, watch wrap, and foot/shoe occupancy. Occlusion-aware: never infer a missing finger/toe when naturally hidden; closed footwear never requires toe counting. Freckles, pores, subtle under-eye detail, natural asymmetry, body softness, skin variation, neat styled hair, and ordinary imperfection are valid and must not be reported. Repairable is true only for a concrete high-confidence local defect; generic beauty preference is never repairable.` : "Human realism category is inactive for this true product-only scene; do not report human anatomy issues.",
    brief.apparelFit?.active && brief.apparelFit.profile ? `APPAREL FIT PRESERVATION V1: Compare all source product views directly with the worn garment. Source images—not the model, preset, or references—govern silhouette, fit category, shoulder width/drop, sleeve cut/volume/length, body width, crop/body/leg length, hem/rib/cuff/waistband, collar, closure line/puller, pocket count/placement/size/angle, seams/panels, material, finish, stiffness, wrinkle and drape behavior. Profile: ${JSON.stringify(brief.apparelFit.profile)}. Use only APPAREL_SILHOUETTE_MISMATCH, APPAREL_FIT_MISMATCH, APPAREL_PROPORTION_MISMATCH, APPAREL_STRUCTURE_MISMATCH, APPAREL_LENGTH_MISMATCH, APPAREL_POCKET_PLACEMENT_ERROR, APPAREL_CLOSURE_STRUCTURE_ERROR, APPAREL_MATERIAL_BEHAVIOR_MISMATCH, APPAREL_DRAPE_MISMATCH, or APPAREL_PRODUCT_BODY_INTERACTION_ERROR. High-confidence silhouette, fit, proportion, structure, or impossible garment/body interaction errors are critical. High-confidence length, pocket, closure, material, or drape errors are major and commercially rejecting. Allow only natural gravity folds, body curvature, pressure and occlusion. Reference 1 remains pose/scene/framing authority but never garment fit authority.` : "Apparel on-model fit validation is inactive; do not report apparel_fit issues.",
    `Resolved strategy: ${brief.strategy}. Scene: ${brief.sceneSuitability?.selectedSceneFamily ?? "not provided"}.`,
    `Composition expectation: ${brief.composition ? JSON.stringify(brief.composition) : "not provided"}.`,
    `Applied creative requirements: ${brief.appliedRequirements.length ? JSON.stringify(brief.appliedRequirements) : "none"}.`,
    `ProductProfile: ${brief.productProfile ? JSON.stringify(brief.productProfile) : "not available; rely on the source image"}.`,
    `Product identity manifest: ${brief.identityManifest ? JSON.stringify(brief.identityManifest) : "source-image baseline only"}.`,
    brief.referenceMatch?.compatible ? `Reference priority validation: Reference 1 is primary. Validate composition resemblance, pose structure, framing, camera angle, and scene layout against its transferable attributes: ${JSON.stringify([...brief.referenceMatch.compositionAdjustments, ...brief.referenceMatch.interactionAdjustments])}. Supporting references are style-only guidance; do not fail or repair for their pose, framing, camera, or scene differences. Consider supporting references only for lighting, mood, color, styling, and atmosphere. Never validate reference product identity, color, branding, geometry, packaging, or artwork as a match requirement.` : "Reference priority validation: inactive or incompatible.",
    brief.referencePreservation
      ? brief.productImageCount && brief.productImageCount > 1
        ? "Reference scene preservation check: the supplied reference base photograph is scene authority only and the final image is the edited output. Compare them for unnecessary changes to pose, anatomy, framing, crop, camera, lighting, background, clothing, skin, and environment. Report material scene changes as reference_match findings. Ignore the required product replacement region. Product identity must be judged only against the complete source-product image set."
        : "Reference scene preservation check: Image 2 is the authoritative base photograph and Image 3 is the edited output. Compare the reference and output for unnecessary changes to pose, anatomy, framing, crop, camera, lighting, background, clothing, skin, and environment. Report material scene changes as reference_match findings. Ignore the required product replacement region. Product identity must still be judged only against Image 1."
      : "Reference scene preservation check: inactive.",
  ].join("\n");
}
