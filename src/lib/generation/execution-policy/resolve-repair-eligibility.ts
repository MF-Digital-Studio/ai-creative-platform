import type { FidelityValidationResult } from "@/lib/fidelity-validation/types";

const nonRepairableCodes = new Set(["minor_cosmetic_imperfection", "background_variation", "composition_preference"]);
const artworkOnlyCodes = new Set(["apparel_artwork_identity_drift", "apparel_artwork_text_drift", "apparel_artwork_structure_drift", "apparel_artwork_placement_drift", "apparel_artwork_scale_drift", "apparel_artwork_color_drift", "apparel_artwork_drift", "apparel_text_drift", "apparel_scale_drift"]);
const severeGlobalRepairCodes = new Set(["different_product", "identity_changed", "product_identity_drift", "garment_type_changed", "apparel_garment_type_drift", "apparel_silhouette_drift", "structural_drift", "geometry_drift", "critical_component_missing", "human_product_contact_error", "body_interaction_failure", "hand_anatomy_error", "finger_count_error", "finger_geometry_error", "body_proportion_error", "pose_implausible"]);
const severeAnatomyRepairCodes = new Set(["hand_anatomy_error", "finger_count_error", "finger_geometry_error", "body_proportion_error", "pose_implausible"]);
const fixableCodes = new Set([
  "product_identity_drift", "identity_changed", "different_product", "garment_type_changed", "apparel_garment_type_drift", "apparel_silhouette_drift", "critical_component_missing", "body_proportion_error", "pose_implausible", "geometry_drift", "structural_drift",
  "human_product_contact_error", "body_interaction_failure", "floating_ring", "hand_anatomy_error",
  "finger_count_error", "finger_geometry_error", "apparel_artwork_identity_drift", "apparel_artwork_text_drift",
  "apparel_artwork_structure_drift", "apparel_artwork_placement_drift", "apparel_artwork_drift",
  "stone_layout_changed", "setting_changed", "band_geometry_changed", "watch_dial_structure_changed",
  "footwear_panel_structure_changed", "package_geometry_changed", "color_material_drift", "branding_corrupted",
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
  if (!input.maximumAttemptsRemaining) return { eligible: false, repairExpectedValue: 0, reason: "repair_limit_reached" };
  const codes = issues.map(({ code }) => code.toLowerCase());
  const artworkOnly = codes.length > 0 && codes.every((code) => artworkOnlyCodes.has(code));
  if (artworkOnly && input.hybridProjectionEnabled && !input.hybridProjectionApplied) return { eligible: false, repairExpectedValue: 0, reason: "artwork_requires_projection_not_full_regeneration" };
  if (artworkOnly) return { eligible: false, repairExpectedValue: 0, reason: "artwork_issue_requires_localized_repair" };
  const actionable = issues.filter((issue) => !nonRepairableCodes.has(issue.code.toLowerCase()) && fixableCodes.has(issue.code.toLowerCase()));
  if (!actionable.length) return { eligible: false, repairExpectedValue: 0, reason: "no_material_targeted_issue" };
  const identityIssues = actionable.filter((issue) => issue.category === "product_identity");
  if (input.hybridProjectionApplied && input.exactProduct && !identityIssues.length) return { eligible: false, repairExpectedValue: 0, reason: "hybrid_projection_resolved_identity" };
  const severeGlobal = actionable.some(({ code, severity }) => severeGlobalRepairCodes.has(code.toLowerCase()) && severity !== "minor" && (!severeAnatomyRepairCodes.has(code.toLowerCase()) || severity === "critical"));
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
