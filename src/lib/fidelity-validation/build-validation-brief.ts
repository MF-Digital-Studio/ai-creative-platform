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
  referencePreservation?: boolean;
}): FidelityValidationBrief {
  return {
    vertical: input.vertical,
    strategy: input.strategy,
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
  };
}

export function renderValidationInstructions(brief: FidelityValidationBrief): string {
  return [
    `You are the semantic post-generation quality gate. Validation version: ${FIDELITY_VALIDATION_VERSION}.`,
    brief.sourceAuthority,
    "Compare the source product image and generated output directly. A visually similar but different product is a material identity failure. Return only the requested structured findings; do not provide free-form reasoning.",
    "Use PRODUCT_IDENTITY_DRIFT for a substituted/different source design (critical). For jewelry use CENTER_STONE_SHAPE_CHANGED, STONE_COUNT_CHANGED, STONE_LAYOUT_CHANGED, SETTING_CHANGED, or BAND_GEOMETRY_CHANGED when materially visible. For watches use WATCH_DIAL_STRUCTURE_CHANGED; footwear FOOTWEAR_PANEL_STRUCTURE_CHANGED; cosmetics PACKAGE_GEOMETRY_CHANGED; apparel GARMENT_ARTWORK_CHANGED. Material identity structure failures are critical or major; harmless perspective-dependent changes are not issues.",
    "Ignore harmless perspective, lighting, natural folds, expected body fitting, and tiny unreadable text unless prominent branding or layout is materially corrupted.",
    brief.vertical === "apparel" ? "Apparel source identity gate: compare the garment against the uploaded product before judging scene quality. Report APPAREL_ARTWORK_DRIFT as critical when artwork composition/design changes; report APPAREL_ARTWORK_PLACEMENT_DRIFT, APPAREL_TEXT_DRIFT, APPAREL_SCALE_DRIFT, APPAREL_COLOR_DRIFT, or APPAREL_SILHOUETTE_DRIFT as at least major when materially changed. Artwork existence, placement, scale, orientation, visible text, garment color, cut, and construction are source-locked. Allow only natural folds, drape, body curvature, perspective, and lighting. Reference images may guide pose/environment/light/crop only and must never override garment or artwork identity, placement, scale, color, text, or construction." : "",
    "Validate only creative requirements listed as applied. Rejected or adjusted requirements are not failures. Preferred/decorative misses are warnings.",
    `Vertical-specific checks: ${brief.verticalChecks.join("; ")}.`,
    `Resolved strategy: ${brief.strategy}. Scene: ${brief.sceneSuitability?.selectedSceneFamily ?? "not provided"}.`,
    `Composition expectation: ${brief.composition ? JSON.stringify(brief.composition) : "not provided"}.`,
    `Applied creative requirements: ${brief.appliedRequirements.length ? JSON.stringify(brief.appliedRequirements) : "none"}.`,
    `ProductProfile: ${brief.productProfile ? JSON.stringify(brief.productProfile) : "not available; rely on the source image"}.`,
    `Product identity manifest: ${brief.identityManifest ? JSON.stringify(brief.identityManifest) : "source-image baseline only"}.`,
    brief.referenceMatch?.compatible ? `Reference match validation (transferable attributes only): ${JSON.stringify(brief.referenceMatch.transferableAttributes)}. Never validate reference product identity, color, branding, geometry, packaging, or artwork as a match requirement.` : "Reference match validation: inactive or incompatible.",
    brief.referencePreservation ? "Reference scene preservation check: Image 2 is the authoritative base photograph and Image 3 is the edited output. Compare the reference and output for unnecessary changes to pose, anatomy, framing, crop, camera, lighting, background, clothing, skin, and environment. Report material scene changes as reference_match findings. Ignore the required product replacement region. Product identity must still be judged only against Image 1." : "Reference scene preservation check: inactive.",
  ].join("\n");
}
