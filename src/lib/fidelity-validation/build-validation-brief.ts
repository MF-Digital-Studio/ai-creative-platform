import type { ProductProfile } from "@/lib/product-understanding/product-profile";
import type { CreativeComplianceResolution } from "@/lib/creative-direction-compliance/types";
import type { FidelityValidationBrief } from "./types";
import { FIDELITY_VALIDATION_VERSION } from "./validation-version";
import type { ReferenceMatchResolution } from "@/lib/generation/references/resolve-reference-match";
import type { ProductIdentityManifest } from "@/lib/product-identity/types";

const verticalChecks: Record<ProductProfile["vertical"], string[]> = {
  jewelry: ["jewelry type, metal, center stone shape/color, stone count/layout, setting, band or chain", "no duplicate or floating jewelry", "natural contact with the resolved body target"],
  watches: ["case, dial layout, bezel, crown, pushers, strap/bracelet, indices, date window, subdials", "do not fail solely for tiny unreadable microtext"],
  footwear: ["silhouette, outsole/midsole, upper panels, laces, tongue, heel, logo, color blocking", "natural scale and ground/foot contact when applicable"],
  apparel: ["garment type, silhouette, color, artwork/logo placement, pockets, closures, hood/collar, construction", "allow natural folds, perspective and body fitting"],
  cosmetics: ["container geometry, cap/pump/dropper, opacity, label/logo placement, liquid/material, dominant colors", "preserve package identity over styling"],
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
}): FidelityValidationBrief {
  return {
    vertical: input.vertical,
    strategy: input.strategy,
    humanRealism: input.humanRealism,
    sourceAuthority: "The original product image is pixel truth. ProductProfile is an interpretation aid and cannot override visible source evidence.",
    referencePreservation: input.referencePreservation === true,
    productProfile: input.productProfile,
    sceneSuitability: input.sceneSuitability,
    composition: input.composition,
    appliedRequirements: input.creativeCompliance?.applied ?? [],
    allowedTransformations: input.productProfile?.allowedTransformations ?? ["perspective_change", "lighting_or_reflection_change"],
    verticalChecks: input.vertical === "product" ? genericChecks : verticalChecks[input.vertical],
    referenceMatch: input.referenceMatch ?? null,
    identityManifest: input.identityManifest ?? null,
    apparelArtworkIdentity: input.apparelArtworkIdentity ?? null,
  };
}

export function renderValidationInstructions(brief: FidelityValidationBrief): string {
  return [
    `You are the semantic post-generation quality gate. Validation version: ${FIDELITY_VALIDATION_VERSION}.`,
    brief.sourceAuthority,
    "Answer: is this still clearly the same product and commercially usable? The source image remains authoritative. Do not demand pixel, angle, or placement identity. Report only material differences that change product identity or make the image unusable.",
    "Each finding must include confidence from 0 to 1, identityImpact (none/minor/major/critical), and likelyCause (source_identity_drift, perspective, fabric_deformation, lighting, body_interaction, typography_change, geometry_change, unknown). Low confidence must not receive critical severity. Keep human_realism separate from product_identity.",
    "Use PRODUCT_IDENTITY_DRIFT for a substituted/different source design (critical at high confidence). For jewelry use CENTER_STONE_SHAPE_CHANGED, STONE_COUNT_CHANGED, STONE_LAYOUT_CHANGED, SETTING_CHANGED, or BAND_GEOMETRY_CHANGED for true structural changes. For watches use WATCH_DIAL_STRUCTURE_CHANGED; footwear FOOTWEAR_PANEL_STRUCTURE_CHANGED; cosmetics PACKAGE_GEOMETRY_CHANGED; apparel GARMENT_ARTWORK_CHANGED. Critical means confident identity change, major means material but potentially recognizable drift, minor means tolerable variation.",
    brief.vertical === "apparel" ? "Apparel calibration: separate small chest logos from large front/back artwork. For a small logo, check logo identity, garment side and scale class; tolerate limited perspective and position movement without pixel coordinates. For large artwork, be stricter about overall composition, typography, major illustration structure, placement and scale. Wrong/missing artwork, materially changed or unreadable wording, changed garment type/color, major repositioning that changes SKU are critical. Recognizable but materially distorted typography, significant illustration proportion or placement/scale drift are major. Small pose-driven shift, slight scale change, fabric folds, local spacing and lighting color/contrast variation are minor." : "",
    brief.vertical === "jewelry" ? "Jewelry calibration: remain strict on stone count, center stone shape, setting/prongs, band geometry, metal color and pendant silhouette. Allow viewing angle, natural chain curvature/fall, skin contact and perspective-driven apparent scale." : "",
    brief.vertical === "watches" ? "Watch calibration: remain strict on dial color/layout/indices/hands, bezel, crown, case proportions and strap/bracelet design. Allow wrist angle, perspective scale, realistic compression/contact and lighting-driven metal reflections." : "",
    brief.vertical === "footwear" ? "Footwear calibration: remain strict on silhouette, sole, major panel layout, laces/closure, logo placement and color blocking. Allow foot angle, perspective, sole compression, creases/flex, and minor shadow/color variation." : "",
    brief.vertical === "cosmetics" ? "Cosmetics calibration: remain strict on package silhouette, cap/pump/applicator, label identity, major text, material/color and proportions. Allow reflections, condensation, hand grip, perspective and mild label curvature." : "",
    "Ignore harmless perspective, lighting, natural folds, expected body fitting, and tiny unreadable text unless prominent branding or layout is materially corrupted.",
    brief.vertical === "apparel" ? `Apparel source identity gate: compare the garment against the uploaded product before judging scene quality. Compare artwork composition, typography, major illustration shapes, dominant graphic colors, relative placement, scale and orientation. Report APPAREL_ARTWORK_IDENTITY_DRIFT as critical for materially different/replaced artwork; APPAREL_ARTWORK_TEXT_DRIFT as critical for materially changed text; APPAREL_ARTWORK_STRUCTURE_DRIFT as major for missing/changed major graphic elements; APPAREL_ARTWORK_PLACEMENT_DRIFT, APPAREL_ARTWORK_SCALE_DRIFT, or APPAREL_ARTWORK_COLOR_DRIFT as major for material changes. Small fold-related deviations are minor. Artwork identity evidence: ${brief.apparelArtworkIdentity ? JSON.stringify(brief.apparelArtworkIdentity) : "no separate crop available; do not claim exact artwork verification"}. Visible text is identity-critical. Reference images may guide pose/environment/light/crop only and must never override garment or artwork identity, placement, scale, color, text, or construction.` : "",
    "Validate only creative requirements listed as applied. Rejected or adjusted requirements are not failures. Preferred/decorative misses are warnings.",
    `Vertical-specific checks: ${brief.verticalChecks.join("; ")}.`,
    brief.humanRealism?.applied ? `Independently assess human_realism only where anatomy is visible (focus: ${brief.humanRealism.focusAreas.join(", ")}). Report PLASTIC_SKIN, OVER_RETOUCHED_SKIN, HAND_ANATOMY_ERROR, FINGER_COUNT_ERROR, FINGER_GEOMETRY_ERROR, NAIL_ANATOMY_ERROR, FACIAL_REALISM_DRIFT, BODY_PROPORTION_ERROR, POSE_IMPLAUSIBLE, HAIR_REALISM_DRIFT, or HUMAN_PRODUCT_CONTACT_ERROR as applicable. Missing/extra/fused fingers, severely malformed hands or impossible limbs are critical. Clear plastic skin, AI face, malformed nails, synthetic hair, major proportion or contact errors are major. Mild retouch or subtle awkwardness is minor. Do not demand severe blemishes or clinical skin texture. Human realism remains required even for glossy editorial styling or a retouched reference.` : "Human realism category is inactive for this still-life scene; do not report human anatomy issues.",
    `Resolved strategy: ${brief.strategy}. Scene: ${brief.sceneSuitability?.selectedSceneFamily ?? "not provided"}.`,
    `Composition expectation: ${brief.composition ? JSON.stringify(brief.composition) : "not provided"}.`,
    `Applied creative requirements: ${brief.appliedRequirements.length ? JSON.stringify(brief.appliedRequirements) : "none"}.`,
    `ProductProfile: ${brief.productProfile ? JSON.stringify(brief.productProfile) : "not available; rely on the source image"}.`,
    `Product identity manifest: ${brief.identityManifest ? JSON.stringify(brief.identityManifest) : "source-image baseline only"}.`,
    brief.referenceMatch?.compatible ? `Reference match validation (transferable attributes only): ${JSON.stringify(brief.referenceMatch.transferableAttributes)}. Never validate reference product identity, color, branding, geometry, packaging, or artwork as a match requirement.` : "Reference match validation: inactive or incompatible.",
    brief.referencePreservation ? "Reference scene preservation check: Image 2 is the authoritative base photograph and Image 3 is the edited output. Compare the reference and output for unnecessary changes to pose, anatomy, framing, crop, camera, lighting, background, clothing, skin, and environment. Report material scene changes as reference_match findings. Ignore the required product replacement region. Product identity must still be judged only against Image 1." : "Reference scene preservation check: inactive.",
  ].join("\n");
}
