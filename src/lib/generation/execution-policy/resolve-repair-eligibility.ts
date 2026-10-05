import type { FidelityValidationResult } from "@/lib/fidelity-validation/types";

const nonRepairableCodes = new Set(["minor_cosmetic_imperfection", "background_variation", "composition_preference"]);
const artworkOnlyCodes = new Set(["apparel_artwork_identity_drift", "apparel_artwork_text_drift", "apparel_artwork_structure_drift", "apparel_artwork_placement_drift", "apparel_artwork_scale_drift", "apparel_artwork_color_drift", "apparel_artwork_drift", "apparel_text_drift", "apparel_scale_drift"]);
const severeGlobalRepairCodes = new Set(["different_product", "identity_changed", "product_identity_drift", "garment_type_changed", "apparel_garment_type_drift", "apparel_silhouette_drift", "structural_drift", "geometry_drift", "critical_component_missing", "human_product_contact_error", "body_interaction_failure", "hand_anatomy_error", "finger_count_error", "finger_geometry_error", "body_proportion_error", "pose_implausible"]);
const jewelryIdentityRepairCodes = new Set(["jewelry_product_substitution", "jewelry_center_stone_shape_drift", "jewelry_center_stone_count_drift", "jewelry_prong_count_drift", "jewelry_setting_geometry_drift", "jewelry_halo_structure_drift", "jewelry_side_stone_drift", "jewelry_band_geometry_drift", "jewelry_metal_color_drift", "jewelry_reference_product_contamination"]);
const severeAnatomyRepairCodes = new Set(["hand_anatomy_error", "finger_count_error", "finger_geometry_error", "body_proportion_error", "pose_implausible"]);
const fixableCodes = new Set([
  "product_identity_drift", "identity_changed", "different_product", "wrong_artwork", "missing_artwork", "wrong_logo", "text_unreadable", "wording_changed", "garment_type_changed", "garment_color_changed", "apparel_garment_type_drift", "apparel_silhouette_drift", "critical_component_missing", "body_proportion_error", "pose_implausible", "geometry_drift", "structural_drift", ...jewelryIdentityRepairCodes,
  "human_product_contact_error", "body_interaction_failure", "floating_ring", "hand_anatomy_error",
  "finger_count_error", "finger_geometry_error", "apparel_artwork_identity_drift", "apparel_artwork_text_drift",
  "apparel_artwork_structure_drift", "apparel_artwork_placement_drift", "apparel_artwork_drift",
  "stone_layout_changed", "setting_changed", "band_geometry_changed", "pendant_geometry_changed", "metal_color_changed", "watch_dial_structure_changed", "bezel_geometry_changed",
  "footwear_panel_structure_changed", "footwear_silhouette_changed", "package_geometry_changed", "color_material_drift", "branding_corrupted",
  "minor_cosmetic_imperfection", "background_variation", "composition_preference",
]);

export type RepairEligibility = { eligible: boolean; repairExpectedValue: number; reason: string };

export function resolveRepairEligibility(input: {
  validation: FidelityValidationResult;
  exactProduct: boolean;
  hybridProjectionApplied: boolean;
  hybridProjectionEnabled?: boolean;
  hybridProjectionReady?: boolean;
  maximumAttemptsRemaining: boolean;
}): RepairEligibility {
  const issues = input.validation.issues;
  if (input.validation.status !== "fail") return { eligible: false, repairExpectedValue: 0, reason: "validation_does_not_reject_candidate" };
  if (!input.maximumAttemptsRemaining) return { eligible: false, repairExpectedValue: 0, reason: "repair_limit_reached" };
  const codes = issues.map(({ code }) => code.toLowerCase());
  const jewelryIdentityOnly = issues.length > 0 && codes.every((code) => jewelryIdentityRepairCodes.has(code));
  if (jewelryIdentityOnly && issues.some((issue) => issue.severity === "critical" && (issue.confidence ?? 0.9) >= 0.75)) return { eligible: true, repairExpectedValue: 80, reason: "critical_jewelry_identity_drift_targeted_repair" };
  const artworkOnly = codes.length > 0 && codes.every((code) => artworkOnlyCodes.has(code));
  if (artworkOnly && input.hybridProjectionEnabled && !input.hybridProjectionApplied) return { eligible: false, repairExpectedValue: 0, reason: "artwork_requires_projection_not_full_regeneration" };
  if (artworkOnly) return { eligible: false, repairExpectedValue: 0, reason: "artwork_issue_requires_localized_repair" };
  const actionable = issues.filter((issue) => !nonRepairableCodes.has(issue.code.toLowerCase()) && fixableCodes.has(issue.code.toLowerCase()) &&
    (issue.severity === "critical" && (issue.confidence ?? 0.9) >= 0.55 || issue.severity === "major" && (issue.confidence ?? 0.9) >= 0.75 && (issue.identityImpact === "major" || issue.category === "human_realism" || issue.category === "geometry" || issue.category === "product_identity" || issue.category === "reference_match")));
  if (!actionable.length) return { eligible: false, repairExpectedValue: 0, reason: "no_material_targeted_issue" };
  const identityIssues = actionable.filter((issue) => issue.category === "product_identity");
  if (input.hybridProjectionApplied && input.exactProduct && !identityIssues.length) return { eligible: false, repairExpectedValue: 0, reason: "hybrid_projection_resolved_identity" };
  const severeGlobal = actionable.some(({ code, severity, identityImpact, category }) => severeGlobalRepairCodes.has(code.toLowerCase()) && severity !== "minor" && (identityImpact === "critical" || identityImpact === "major" || severity === "critical" || category === "product_identity" || category === "geometry") && (!severeAnatomyRepairCodes.has(code.toLowerCase()) || severity === "critical"));
  if (!severeGlobal) return { eligible: false, repairExpectedValue: 0, reason: "full_repair_low_expected_value" };
  const probability = actionable.some(({ category }) => category === "product_identity" || category === "geometry" || category === "human_realism") ? .8 : .65;
  const severityValue = actionable.some(({ severity }) => severity === "critical") ? 1 : .7;
  const subsystemPenalty = input.hybridProjectionEnabled && !input.hybridProjectionApplied ? .25 : 1;
  const usability = input.validation.status === "fail" ? 1 : .5;
  const repairExpectedValue = Math.round(probability * severityValue * subsystemPenalty * usability * 100);
  return repairExpectedValue >= 50
    ? { eligible: true, repairExpectedValue, reason: "severe_global_failure_high_repair_value" }
    : { eligible: false, repairExpectedValue, reason: "full_repair_low_expected_value" };
}
