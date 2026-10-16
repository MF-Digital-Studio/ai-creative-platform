import { fidelityValidationCategories, type FidelityIdentityImpact, type FidelityIssueSeverity, type FidelityLikelyCause, type FidelityValidationCheck, type FidelityValidationIssue, type FidelityValidationResult } from "./types";
import type { PresentationContractField } from "@/lib/creative-presets/presentation-mode-contracts";
import { FIDELITY_VALIDATION_VERSION } from "./validation-version";

const validCategories = new Set<string>(fidelityValidationCategories);
const footwearAnatomyCodes = new Set(["foot_anatomy_error", "visible_toe_count_error", "footwear_fit_mismatch"]);
const criticalHumanCodes = new Set(["human_anatomy_error", "human_hand_anatomy_error", "visible_finger_count_error", "finger_count_error", "hand_anatomy_error", "finger_geometry_error", "human_face_anatomy_error", "human_eye_realism_error", "human_limb_anatomy_error", "body_proportion_error", "severe_physical_failure", "bag_contact_implausible", "body_product_interaction_error", ...footwearAnatomyCodes]);
const presetComplianceCodes = new Set([
  "bag_preset_scene_mismatch", "preset_scene_mismatch", "preset_interaction_mismatch", "preset_presentation_mode_mismatch", "product_only_mode_human_leak", "product_only_mode_environment_leak",
  "preset_macro_framing_mismatch", "preset_floating_support_mismatch", "preset_top_down_camera_mismatch", "preset_front_orientation_mismatch",
  "preset_pair_composition_mismatch", "preset_pedestal_support_mismatch", "ghost_mannequin_phantom_body_artifact", "preset_reflection_mismatch",
  "preset_clinical_scene_mismatch", "preset_botanical_scene_mismatch", "preset_liquid_interaction_mismatch", "bag_carry_mode_mismatch", "jewelry_body_target_mismatch",
]);
const majorPresetCodes = new Set(["preset_environment_too_generic", "preset_variation_collapse"]);
const referenceOverriddenPresetCodes = new Set(["preset_scene_mismatch", "preset_interaction_mismatch", "preset_environment_too_generic", "bag_preset_scene_mismatch"]);
const majorHumanCodes = new Set(["human_skin_plastic", "human_skin_overretouched", "human_texture_unrealistic", "human_face_uncanny", "human_expression_unnatural", "human_hair_synthetic", "human_posture_unnatural", "plastic_skin_appearance", "unrealistic_human_texture", "face_realism_error", "plastic_skin", "over_retouched_skin", "facial_realism_drift", "hair_realism_drift", "human_product_contact_error", "body_interaction_failure", "nail_anatomy_error", "pose_implausible"]);
const criticalApparelFitCodes = new Set(["apparel_silhouette_mismatch", "apparel_fit_mismatch", "apparel_proportion_mismatch", "apparel_structure_mismatch", "apparel_product_body_interaction_error"]);
const majorApparelFitCodes = new Set(["apparel_length_mismatch", "apparel_pocket_placement_error", "apparel_closure_structure_error", "apparel_material_behavior_mismatch", "apparel_drape_mismatch"]);
const physicalIntegrationCodes = new Set([
  "watch_case_rotation_mismatch", "watch_wrist_axis_mismatch", "watch_flat_overlay_appearance", "watch_strap_not_wrapped", "watch_contact_failure",
  "watch_flat_product_appearance", "watch_front_face_only_render", "watch_dial_orientation_mismatch", "watch_case_depth_missing", "watch_side_geometry_missing", "watch_bracelet_wrap_error", "watch_case_floating", "watch_contact_shadow_missing", "watch_perspective_mismatch", "watch_reflection_integration_error", "watch_scale_to_wrist_error", "watch_lug_strap_geometry_impossible", "watch_unwearable_fit",
  "jewelry_flat_product_appearance", "jewelry_front_face_only_render", "jewelry_depth_missing", "jewelry_side_profile_missing", "jewelry_body_attachment_error", "jewelry_contact_shadow_missing", "earring_ear_attachment_error", "earring_setting_depth_missing", "earring_floating", "jewelry_perspective_mismatch", "jewelry_reflection_integration_error", "jewelry_scale_to_body_error",
]);
const severeStructuralCodes = new Set(["severe_physical_failure", "malformed_product", "structural_duplication", "duplicate_product", "product_duplication"]);
const jewelryCriticalCodes = new Set(["jewelry_product_substitution", "jewelry_center_stone_shape_drift", "jewelry_center_stone_count_drift", "jewelry_prong_count_drift", "jewelry_setting_geometry_drift", "jewelry_halo_structure_drift", "jewelry_side_stone_drift", "jewelry_band_geometry_drift", "jewelry_metal_color_drift", "jewelry_reference_product_contamination"]);
const bagCriticalCodes = new Set(["bag_product_substitution", "bag_silhouette_drift", "bag_handle_count_drift", "bag_strap_drift", "bag_closure_drift", "bag_flap_geometry_drift", "bag_hardware_drift", "bag_logo_monogram_drift", "bag_color_drift", "bag_pocket_layout_drift"]);
const bagMinorCodes = new Set(["bag_natural_deformation", "bag_perspective_variation", "bag_material_reflection_variation", "bag_strap_bend"]);
const hardCriticalIdentityCodes = new Set(["product_identity_drift", "different_product", "wrong_artwork", "missing_artwork", "wrong_logo", "garment_type_changed", "garment_color_changed", "apparel_color_drift", "text_unreadable", "wording_changed", "branding_corrupted", "package_geometry_changed", "critical_component_missing", "center_stone_shape_changed", "stone_count_changed", "setting_changed", "band_geometry_changed", "pendant_geometry_changed", "watch_dial_structure_changed", "changed_dial_layout", "footwear_silhouette_changed", "footwear_panel_structure_changed", "apparel_artwork_identity_drift", "apparel_artwork_text_drift", ...jewelryCriticalCodes, ...bagCriticalCodes]);
// These codes directly state a source-product substitution or exact visible
// identity loss, unlike category-specific geometry variants that retain their
// existing calibrated severity handling below.
const nonOverridableCriticalIdentityCodes = new Set(["product_identity_drift", "different_product", "jewelry_product_substitution", "bag_product_substitution"]);
const majorIdentityCodes = new Set(["stone_layout_changed", "stone_count_changed", "setting_changed", "band_geometry_changed", "watch_dial_structure_changed", "footwear_panel_structure_changed", "package_geometry_changed", "garment_artwork_changed", "changed_dial_layout", "apparel_artwork_structure_drift", "apparel_artwork_placement_drift", "apparel_artwork_scale_drift", "apparel_artwork_color_drift", "apparel_scale_drift", "apparel_color_drift", "apparel_silhouette_drift", "text_distortion", "typography_distortion", "logo_identity_changed", "metal_color_changed", "bezel_geometry_changed", "sole_shape_changed"]);
const placementVariationCodes = new Set(["apparel_artwork_placement_drift", "apparel_scale_drift", "apparel_artwork_scale_drift", "artwork_position_shift", "logo_position_shift", "print_position_shift", "chain_fall_variation", "perspective_scale_variation", "wrist_angle_variation", "footwear_flex", "fabric_deformation", "lighting_color_variation", "cosmetics_reflection_variation", "label_curvature"]);
const codeCause: Record<string, FidelityLikelyCause> = {
  apparel_artwork_text_drift: "typography_change", apparel_text_drift: "typography_change", text_distortion: "typography_change", typography_distortion: "typography_change", wording_changed: "typography_change", text_unreadable: "typography_change",
  apparel_artwork_placement_drift: "perspective", apparel_artwork_scale_drift: "fabric_deformation", apparel_scale_drift: "fabric_deformation", artwork_position_shift: "perspective", logo_position_shift: "perspective", print_position_shift: "perspective",
  color_material_drift: "lighting", lighting_color_variation: "lighting", metal_color_changed: "source_identity_drift", chain_fall_variation: "body_interaction", body_product_interaction_error: "body_interaction", human_product_contact_error: "body_interaction", body_interaction_failure: "body_interaction",
  apparel_product_body_interaction_error: "body_interaction", apparel_drape_mismatch: "fabric_deformation", apparel_material_behavior_mismatch: "source_identity_drift",
  apparel_silhouette_mismatch: "geometry_change", apparel_fit_mismatch: "geometry_change", apparel_proportion_mismatch: "geometry_change", apparel_structure_mismatch: "geometry_change", apparel_length_mismatch: "geometry_change", apparel_pocket_placement_error: "geometry_change", apparel_closure_structure_error: "geometry_change",
  package_geometry_changed: "geometry_change", geometry_drift: "geometry_change", footwear_silhouette_changed: "geometry_change", footwear_panel_structure_changed: "geometry_change", changed_dial_layout: "geometry_change", watch_dial_structure_changed: "geometry_change", pendant_geometry_changed: "geometry_change",
};

function isIssue(value: unknown): value is Omit<FidelityValidationIssue, "issueCode" | "confidence" | "identityImpact" | "likelyCause" | "presetMismatchFields"> & Partial<Pick<FidelityValidationIssue, "issueCode" | "confidence" | "identityImpact" | "likelyCause">> & { presetMismatchFields?: unknown } {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.code === "string" && typeof item.category === "string" && validCategories.has(item.category) && typeof item.severity === "string" &&
    typeof item.finding === "string" && typeof item.expected === "string" && ["critical", "major", "minor"].includes(item.severity);
}

function defaultImpact(code: string, category: FidelityValidationIssue["category"], severity: FidelityIssueSeverity): FidelityIdentityImpact {
  if (hardCriticalIdentityCodes.has(code)) return "critical";
  if (category === "apparel_fit") return severity === "minor" ? "minor" : "major";
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
  if (physicalIntegrationCodes.has(code)) return confidence >= 0.75 ? "critical" : confidence >= 0.55 ? "major" : "minor";
  if (issue.category === "reference_match" && /supporting.*(style|lighting)|style.*missed|lighting.*missed/.test(code)) return "minor";
  if (issue.category === "human_realism" && criticalHumanCodes.has(code)) return confidence < 0.75 ? (confidence < 0.55 ? "minor" : "major") : "critical";
  if (issue.category === "human_realism" && majorHumanCodes.has(code) && confidence >= 0.75 && issue.severity === "minor") return "major";
  if (issue.category === "apparel_fit" && criticalApparelFitCodes.has(code)) return confidence >= 0.75 ? "critical" : confidence >= 0.55 ? "major" : "minor";
  if (issue.category === "apparel_fit" && majorApparelFitCodes.has(code) && confidence >= 0.75) return "major";
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
    const code = issue.code.toLowerCase();
    const confidence = Math.max(0, Math.min(1, Number.isFinite(issue.confidence) ? issue.confidence! : 0.9));
    // Canonical identity-drift codes are stronger evidence than a contradictory
    // model-supplied impact label. Without this, a known product substitution
    // could be downgraded to a non-blocking warning.
    const identityImpact = nonOverridableCriticalIdentityCodes.has(code)
      ? "critical"
      : issue.identityImpact ?? defaultImpact(code, issue.category, issue.severity);
    const normalizedIssue = {
      ...issue,
      issueCode: issue.issueCode || issue.code,
      confidence,
      identityImpact,
      likelyCause: issue.likelyCause ?? codeCause[code] ?? (issue.category === "geometry" ? "geometry_change" : "unknown"),
      region: issue.region ?? "unspecified",
      repairable: issue.repairable ?? issue.category === "human_realism",
      commercialImpact: issue.commercialImpact ?? (issue.severity === "critical" ? "high" : issue.severity === "major" ? "medium" : "low"),
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
  const criticalHuman = normalized.some((issue) => issue.category === "human_realism" && issue.severity === "critical" && criticalHumanCodes.has(issue.code.toLowerCase()));
  const severeStructure = normalized.some((issue) => severeStructuralCodes.has(issue.code.toLowerCase()) && issue.severity !== "minor");
  const majorIdentityCount = normalized.filter((issue) => issue.identityImpact === "major" && issue.severity === "major").length;
  const majorHumanCount = normalized.filter((issue) => issue.category === "human_realism" && issue.severity === "major").length;
  const majorHumanTerminal = normalized.some((issue) => issue.category === "human_realism" && majorHumanCodes.has(issue.code.toLowerCase()) && issue.severity === "major" && issue.confidence >= 0.8);
  const criticalApparelFit = normalized.some((issue) => issue.category === "apparel_fit" && criticalApparelFitCodes.has(issue.code.toLowerCase()) && issue.severity === "critical" && issue.confidence >= 0.75);
  const physicalIntegrationFailure = normalized.some((issue) => physicalIntegrationCodes.has(issue.code.toLowerCase()) && issue.severity === "critical" && issue.confidence >= 0.75);
  const majorApparelFit = normalized.some((issue) => issue.category === "apparel_fit" && majorApparelFitCodes.has(issue.code.toLowerCase()) && issue.severity === "major" && issue.confidence >= 0.8);
  const presetComplianceFailure = normalized.some((issue) => presetComplianceCodes.has(issue.code.toLowerCase()) && issue.severity !== "minor" && issue.confidence >= 0.75);
  const majorPresetFailure = normalized.some((issue) => majorPresetCodes.has(issue.code.toLowerCase()) && issue.severity === "major" && issue.confidence >= 0.75);
  const status = footwearAnatomyFailure || criticalIdentity || criticalHuman || majorHumanTerminal || criticalApparelFit || physicalIntegrationFailure || majorApparelFit || severeStructure || presetComplianceFailure || majorPresetFailure || majorIdentityCount >= 2 || majorHumanCount >= 2
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

const presentationContractFields = new Set<PresentationContractField>(["sceneType", "environment", "cameraDistance", "cameraAngle", "framing", "subjectScale", "subjectPlacement", "productOrientation", "physicalSupport", "gravityBehavior", "humanPresence", "interactionMode", "surface", "propLanguage", "lighting", "captureProfile", "productCount", "targetDetail"]);

function inferredPresetMismatchFields(issue: FidelityValidationIssue): PresentationContractField[] {
  const explicit = (issue.presetMismatchFields ?? []).filter((field): field is PresentationContractField => presentationContractFields.has(field));
  if (explicit.length) return [...new Set(explicit)];
  const detail = `${issue.finding} ${issue.expected} ${issue.region}`.toLowerCase();
  const inferred: PresentationContractField[] = [];
  const keywords: Array<[PresentationContractField, RegExp]> = [["cameraDistance", /camera distance|macro|close-up|wide/], ["cameraAngle", /camera angle|overhead|eye.level|low.angle/], ["framing", /framing|crop|full.body|close.up/], ["environment", /environment|street|studio|background/], ["lighting", /lighting|light/], ["surface", /surface|tabletop|floor/], ["propLanguage", /prop/], ["subjectPlacement", /placement|centered|negative space/], ["humanPresence", /human|person|model|body/], ["interactionMode", /interaction|wearing|carrying|holding/]];
  for (const [field, pattern] of keywords) if (pattern.test(detail)) inferred.push(field);
  return [...new Set(inferred)];
}

export function suppressReferenceAuthorityPresetIssues(issues: FidelityValidationIssue[], referenceAuthority: boolean, overriddenFields: readonly string[] = []): FidelityValidationIssue[] {
  if (!referenceAuthority) return issues;
  if (!overriddenFields.length) return issues;
  return issues.filter((issue) => {
    const code = issue.code.toLowerCase();
    if (code === "preset_presentation_mode_mismatch") {
      const fields = inferredPresetMismatchFields(issue);
      return fields.length === 0 || !fields.every((field) => overriddenFields.includes(field));
    }
    if (code === "preset_scene_mismatch" || code === "preset_environment_too_generic" || code === "bag_preset_scene_mismatch") return !overriddenFields.includes("environment");
    if (code === "preset_interaction_mismatch") return !overriddenFields.includes("interactionMode");
    return !referenceOverriddenPresetCodes.has(code);
  });
}

/** Artwork-specific findings require a positive source artwork signal. */
export function suppressUnsupportedApparelArtworkIssues(issues: FidelityValidationIssue[], artworkPresent: boolean | null | undefined): FidelityValidationIssue[] {
  return artworkPresent === true ? issues : issues.filter((issue) => !issue.code.toLowerCase().startsWith("apparel_artwork_"));
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
    const identityImpact = nonOverridableCriticalIdentityCodes.has(canonicalCode)
      ? "critical"
      : input.identityImpact ?? defaultImpact(canonicalCode, category, input.severity);
    const presetMismatchFields = Array.isArray(input.presetMismatchFields)
      ? input.presetMismatchFields.filter((field): field is PresentationContractField => typeof field === "string" && presentationContractFields.has(field as PresentationContractField))
      : [];
    const normalized = {
      code: canonicalCode, issueCode: input.issueCode || canonicalCode, category, severity: input.severity, finding: input.finding, expected: input.expected,
      confidence, identityImpact, likelyCause: input.likelyCause ?? codeCause[canonicalCode] ?? "unknown" as FidelityLikelyCause,
      region: input.region ?? "unspecified", repairable: input.repairable ?? category === "human_realism",
      commercialImpact: input.commercialImpact ?? (input.severity === "critical" ? "high" : input.severity === "major" ? "medium" : "low"),
      presetMismatchFields,
      sourceAuthoritative: true,
    } satisfies FidelityValidationIssue;
    return { ...normalized, severity: confidenceAdjustedSeverity(normalized) };
  });
}
