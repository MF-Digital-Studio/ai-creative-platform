import { fidelityValidationCategories, type FidelityIdentityImpact, type FidelityIssueSeverity, type FidelityLikelyCause, type FidelityValidationCheck, type FidelityValidationIssue, type FidelityValidationResult } from "./types";
import { FIDELITY_VALIDATION_VERSION } from "./validation-version";

const validCategories = new Set<string>(fidelityValidationCategories);
const footwearAnatomyCodes = new Set(["foot_anatomy_error", "visible_toe_count_error", "footwear_fit_mismatch"]);
const criticalHumanCodes = new Set(["human_anatomy_error", "visible_finger_count_error", "finger_count_error", "hand_anatomy_error", "finger_geometry_error", "severe_physical_failure", "bag_contact_implausible", ...footwearAnatomyCodes]);
const presetComplianceCodes = new Set(["bag_preset_scene_mismatch", "preset_scene_mismatch", "preset_interaction_mismatch", "preset_presentation_mode_mismatch", "product_only_mode_human_leak", "product_only_mode_environment_leak"]);
const majorPresetCodes = new Set(["preset_environment_too_generic", "preset_variation_collapse"]);
const referenceOverriddenPresetCodes = new Set(["preset_scene_mismatch", "preset_interaction_mismatch", "preset_environment_too_generic", "bag_preset_scene_mismatch"]);
const majorHumanCodes = new Set(["plastic_skin_appearance", "unrealistic_human_texture", "face_realism_error", "body_product_interaction_error", "plastic_skin", "over_retouched_skin", "facial_realism_drift", "body_proportion_error", "hair_realism_drift", "human_product_contact_error", "body_interaction_failure", "nail_anatomy_error", "pose_implausible"]);
const severeStructuralCodes = new Set(["severe_physical_failure", "malformed_product", "structural_duplication", "duplicate_product", "product_duplication"]);
const jewelryCriticalCodes = new Set(["jewelry_product_substitution", "jewelry_center_stone_shape_drift", "jewelry_center_stone_count_drift", "jewelry_prong_count_drift", "jewelry_setting_geometry_drift", "jewelry_halo_structure_drift", "jewelry_side_stone_drift", "jewelry_band_geometry_drift", "jewelry_metal_color_drift", "jewelry_reference_product_contamination"]);
const bagCriticalCodes = new Set(["bag_product_substitution", "bag_silhouette_drift", "bag_handle_count_drift", "bag_strap_drift", "bag_closure_drift", "bag_flap_geometry_drift", "bag_hardware_drift", "bag_logo_monogram_drift", "bag_color_drift", "bag_pocket_layout_drift"]);
const bagMinorCodes = new Set(["bag_natural_deformation", "bag_perspective_variation", "bag_material_reflection_variation", "bag_strap_bend"]);
const hardCriticalIdentityCodes = new Set(["product_identity_drift", "different_product", "wrong_artwork", "missing_artwork", "wrong_logo", "garment_type_changed", "garment_color_changed", "apparel_color_drift", "text_unreadable", "wording_changed", "branding_corrupted", "package_geometry_changed", "critical_component_missing", "center_stone_shape_changed", "stone_count_changed", "setting_changed", "band_geometry_changed", "pendant_geometry_changed", "watch_dial_structure_changed", "changed_dial_layout", "footwear_silhouette_changed", "footwear_panel_structure_changed", "apparel_artwork_identity_drift", "apparel_artwork_text_drift", ...jewelryCriticalCodes, ...bagCriticalCodes]);
const majorIdentityCodes = new Set(["stone_layout_changed", "stone_count_changed", "setting_changed", "band_geometry_changed", "watch_dial_structure_changed", "footwear_panel_structure_changed", "package_geometry_changed", "garment_artwork_changed", "changed_dial_layout", "apparel_artwork_structure_drift", "apparel_artwork_placement_drift", "apparel_artwork_scale_drift", "apparel_artwork_color_drift", "apparel_scale_drift", "apparel_color_drift", "apparel_silhouette_drift", "text_distortion", "typography_distortion", "logo_identity_changed", "metal_color_changed", "bezel_geometry_changed", "sole_shape_changed"]);
const placementVariationCodes = new Set(["apparel_artwork_placement_drift", "apparel_scale_drift", "apparel_artwork_scale_drift", "artwork_position_shift", "logo_position_shift", "print_position_shift", "chain_fall_variation", "perspective_scale_variation", "wrist_angle_variation", "footwear_flex", "fabric_deformation", "lighting_color_variation", "cosmetics_reflection_variation", "label_curvature"]);
const codeCause: Record<string, FidelityLikelyCause> = {
  apparel_artwork_text_drift: "typography_change", apparel_text_drift: "typography_change", text_distortion: "typography_change", typography_distortion: "typography_change", wording_changed: "typography_change", text_unreadable: "typography_change",
  apparel_artwork_placement_drift: "perspective", apparel_artwork_scale_drift: "fabric_deformation", apparel_scale_drift: "fabric_deformation", artwork_position_shift: "perspective", logo_position_shift: "perspective", print_position_shift: "perspective",
  color_material_drift: "lighting", lighting_color_variation: "lighting", metal_color_changed: "source_identity_drift", chain_fall_variation: "body_interaction", body_product_interaction_error: "body_interaction", human_product_contact_error: "body_interaction", body_interaction_failure: "body_interaction",
  package_geometry_changed: "geometry_change", geometry_drift: "geometry_change", footwear_silhouette_changed: "geometry_change", footwear_panel_structure_changed: "geometry_change", changed_dial_layout: "geometry_change", watch_dial_structure_changed: "geometry_change", pendant_geometry_changed: "geometry_change",
};

function isIssue(value: unknown): value is Omit<FidelityValidationIssue, "issueCode" | "confidence" | "identityImpact" | "likelyCause"> & Partial<Pick<FidelityValidationIssue, "issueCode" | "confidence" | "identityImpact" | "likelyCause">> {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.code === "string" && typeof item.category === "string" && validCategories.has(item.category) && typeof item.severity === "string" &&
    typeof item.finding === "string" && typeof item.expected === "string" && ["critical", "major", "minor"].includes(item.severity);
}

function defaultImpact(code: string, category: FidelityValidationIssue["category"], severity: FidelityIssueSeverity): FidelityIdentityImpact {
  if (hardCriticalIdentityCodes.has(code)) return "critical";
  if (majorIdentityCodes.has(code) || category === "product_identity" && severity === "major") return "major";
  if (["product_identity", "geometry", "branding_text", "color_material"].includes(category)) return severity === "minor" ? "minor" : "major";
  return "none";
}

function confidenceAdjustedSeverity(issue: Pick<FidelityValidationIssue, "code" | "category" | "severity" | "confidence" | "identityImpact">): FidelityIssueSeverity {
  const code = issue.code.toLowerCase();
  if (footwearAnatomyCodes.has(code)) return "critical";
  if (presetComplianceCodes.has(code)) return "critical";
  if (majorPresetCodes.has(code)) return "major";
  if (bagMinorCodes.has(code)) return "minor";
  const confidence = issue.confidence ?? 0.9;
  if (issue.category === "reference_match" && /supporting.*(style|lighting)|style.*missed|lighting.*missed/.test(code)) return "minor";
  if (issue.category === "human_realism" && criticalHumanCodes.has(code)) return confidence < 0.55 ? "major" : "critical";
  if (issue.category === "human_realism" && majorHumanCodes.has(code) && confidence >= 0.75 && issue.severity === "minor") return "major";
  if (hardCriticalIdentityCodes.has(code) && issue.identityImpact === "critical") return confidence < 0.55 ? "major" : "critical";
  if (confidence < 0.55 && issue.severity === "critical") {
    if (hardCriticalIdentityCodes.has(code) && issue.identityImpact === "critical") return "major";
    return "minor";
  }
  if (issue.category === "product_identity" && issue.severity === "critical" && placementVariationCodes.has(code)) return "minor";
  if (issue.category === "product_identity" && issue.severity === "critical" && issue.identityImpact !== "critical") return "major";
  if (issue.severity === "critical" && issue.identityImpact === "critical" && (hardCriticalIdentityCodes.has(code) || confidence >= 0.8)) return "critical";
  return issue.severity;
}

export function resolveQualityGate(issues: FidelityValidationIssue[]): FidelityValidationResult {
  const normalized = issues.map((issue) => {
    const confidence = Math.max(0, Math.min(1, Number.isFinite(issue.confidence) ? issue.confidence! : 0.9));
    const identityImpact = issue.identityImpact ?? defaultImpact(issue.code.toLowerCase(), issue.category, issue.severity);
    const normalizedIssue = {
      ...issue,
      issueCode: issue.issueCode || issue.code,
      confidence,
      identityImpact,
      likelyCause: issue.likelyCause ?? codeCause[issue.code.toLowerCase()] ?? (issue.category === "geometry" ? "geometry_change" : "unknown"),
    };
    return { ...normalizedIssue, severity: confidenceAdjustedSeverity(normalizedIssue) };
  });
  const checksByCategory = new Map<string, FidelityValidationCheck>();
  for (const issue of normalized) {
    const existing = checksByCategory.get(issue.category);
    if (existing) { existing.passed = false; existing.issueCodes.push(issue.code); }
    else checksByCategory.set(issue.category, { category: issue.category, passed: false, finding: issue.finding, issueCodes: [issue.code] });
  }
  const checks = fidelityValidationCategories.map((category) => checksByCategory.get(category) ?? { category, passed: true, finding: "No material issue reported.", issueCodes: [] });
  const criticalIdentity = normalized.some((issue) => issue.identityImpact === "critical" && issue.severity === "critical");
  const footwearAnatomyFailure = normalized.some((issue) => footwearAnatomyCodes.has(issue.code.toLowerCase()));
  const criticalHuman = normalized.some((issue) => issue.category === "human_realism" && issue.severity === "critical" && (criticalHumanCodes.has(issue.code.toLowerCase()) || issue.code.toLowerCase() === "body_proportion_error"));
  const severeStructure = normalized.some((issue) => severeStructuralCodes.has(issue.code.toLowerCase()) && issue.severity !== "minor");
  const majorIdentityCount = normalized.filter((issue) => issue.identityImpact === "major" && issue.severity === "major").length;
  const majorHumanCount = normalized.filter((issue) => issue.category === "human_realism" && issue.severity === "major").length;
  const presetComplianceFailure = normalized.some((issue) => presetComplianceCodes.has(issue.code.toLowerCase()) && issue.severity !== "minor" && issue.confidence >= 0.75);
  const majorPresetFailure = normalized.some((issue) => majorPresetCodes.has(issue.code.toLowerCase()) && issue.severity === "major" && issue.confidence >= 0.75);
  const status = footwearAnatomyFailure || criticalIdentity || criticalHuman || severeStructure || presetComplianceFailure || majorPresetFailure || majorIdentityCount >= 2 || majorHumanCount >= 2
    ? "fail"
    : normalized.length > 0 ? "pass_with_warnings" : "pass";
  const severity = normalized.some((issue) => issue.severity === "critical") ? "critical" : normalized.some((issue) => issue.severity === "major") ? "major" : normalized.length ? "minor" : null;
  const commerciallyUsable = status !== "fail" && !normalized.some((issue) => issue.identityImpact === "critical" && issue.confidence >= 0.75 && issue.severity !== "minor");
  return {
    status, commerciallyUsable, checks, issues: normalized, severity,
    retryRecommended: status === "fail" && normalized.some((issue) => issue.severity === "critical" || issue.severity === "major" && issue.confidence >= 0.75),
    summary: status === "pass" ? "Product identity and commercial usability checks passed." : status === "pass_with_warnings" ? "The output is commercially usable with non-blocking fidelity warnings." : "The output failed a material identity, human usability, or structural quality check.",
    version: FIDELITY_VALIDATION_VERSION,
  };
}

export function suppressReferenceAuthorityPresetIssues(issues: FidelityValidationIssue[], referenceAuthority: boolean): FidelityValidationIssue[] {
  if (!referenceAuthority) return issues;
  return issues.filter((issue) => !referenceOverriddenPresetCodes.has(issue.code.toLowerCase()));
}

export function mapStructuredValidationOutput(value: unknown): FidelityValidationIssue[] {
  if (typeof value !== "object" || value === null) throw new Error("Fidelity validation output is not an object.");
  const raw = (value as { findings?: unknown }).findings;
  if (!Array.isArray(raw)) throw new Error("Fidelity validation output has no findings array.");
  return raw.filter(isIssue).map((input) => {
    const code = input.code.toLowerCase();
    const canonicalCode = code === "apparel_artwork_drift" ? "apparel_artwork_identity_drift" : code === "apparel_text_drift" ? "apparel_artwork_text_drift" : code === "garment_artwork_changed" ? "wrong_artwork" : jewelryCriticalCodes.has(code) ? code : code;
    const category = hardCriticalIdentityCodes.has(canonicalCode) || majorIdentityCodes.has(canonicalCode) || canonicalCode.startsWith("apparel_artwork_") || canonicalCode.startsWith("jewelry_") || ["apparel_scale_drift", "apparel_color_drift", "apparel_silhouette_drift"].includes(canonicalCode)
      ? "product_identity" as const : input.category;
    const confidence = typeof input.confidence === "number" && Number.isFinite(input.confidence) ? Math.max(0, Math.min(1, input.confidence)) : 0.9;
    const identityImpact = input.identityImpact ?? defaultImpact(canonicalCode, category, input.severity);
    const normalized = {
      code: canonicalCode, issueCode: input.issueCode || canonicalCode, category, severity: input.severity, finding: input.finding, expected: input.expected,
      confidence, identityImpact, likelyCause: input.likelyCause ?? codeCause[canonicalCode] ?? "unknown" as FidelityLikelyCause,
      sourceAuthoritative: true,
    } satisfies FidelityValidationIssue;
    return { ...normalized, severity: confidenceAdjustedSeverity(normalized) };
  });
}
