import { fidelityValidationCategories, type FidelityValidationCheck, type FidelityValidationIssue, type FidelityValidationResult } from "./types";
import { FIDELITY_VALIDATION_VERSION } from "./validation-version";

const retryCodes = new Set(["identity_changed", "geometry_drift", "body_interaction_failure", "required_creative_missing", "structural_drift", "reference_composition_missed", "reference_hand_direction_missed", "reference_background_missed", "product_identity_drift", "center_stone_shape_changed", "stone_count_changed", "stone_layout_changed", "setting_changed", "band_geometry_changed", "watch_dial_structure_changed", "footwear_panel_structure_changed", "package_geometry_changed", "garment_artwork_changed", "apparel_artwork_drift", "apparel_artwork_identity_drift", "apparel_artwork_text_drift", "apparel_artwork_structure_drift", "apparel_artwork_placement_drift", "apparel_text_drift", "apparel_scale_drift", "apparel_artwork_scale_drift", "apparel_color_drift", "apparel_artwork_color_drift", "apparel_silhouette_drift"]);
const failMajorCategories = new Set(["product_identity", "geometry", "body_interaction", "structural_integrity"]);
const validCategories = new Set<string>(fidelityValidationCategories);
const criticalHumanCodes = new Set(["finger_count_error", "hand_anatomy_error"]);
const majorHumanCodes = new Set(["plastic_skin", "facial_realism_drift", "body_proportion_error", "hair_realism_drift", "human_product_contact_error", "nail_anatomy_error"]);
const criticalIdentityCodes = new Set(["product_identity_drift", "different_product"]);
const majorIdentityCodes = new Set(["center_stone_shape_changed", "stone_count_changed", "stone_layout_changed", "setting_changed", "band_geometry_changed", "watch_dial_structure_changed", "footwear_panel_structure_changed", "package_geometry_changed", "garment_artwork_changed", "changed_dial_layout"]);
const apparelIdentityCodes = new Set(["apparel_artwork_drift", "apparel_artwork_identity_drift", "apparel_artwork_text_drift", "apparel_artwork_structure_drift", "apparel_artwork_placement_drift", "apparel_text_drift", "apparel_scale_drift", "apparel_artwork_scale_drift", "apparel_color_drift", "apparel_artwork_color_drift", "apparel_silhouette_drift"]);
const criticalApparelIdentityCodes = new Set(["apparel_artwork_drift", "apparel_artwork_identity_drift", "apparel_artwork_text_drift"]);

function isIssue(value: unknown): value is FidelityValidationIssue {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.code === "string" && typeof item.category === "string" && validCategories.has(item.category) && typeof item.severity === "string" &&
    typeof item.finding === "string" && typeof item.expected === "string" &&
    ["critical", "major", "minor"].includes(item.severity);
}

export function resolveQualityGate(issues: FidelityValidationIssue[]): FidelityValidationResult {
  const checksByCategory = new Map<string, FidelityValidationCheck>();
  for (const issue of issues) {
    const existing = checksByCategory.get(issue.category);
    if (existing) {
      existing.passed = false;
      existing.issueCodes.push(issue.code);
    } else {
      checksByCategory.set(issue.category, {
        category: issue.category as FidelityValidationCheck["category"],
        passed: false,
        finding: issue.finding,
        issueCodes: [issue.code],
      });
    }
  }
  const allCategories = fidelityValidationCategories;
  const checks = allCategories.map((category) => checksByCategory.get(category) ?? {
    category,
    passed: true,
    finding: "No material issue reported.",
    issueCodes: [],
  });
  const criticalCount = issues.filter((issue) => issue.severity === "critical").length;
  const majorIssues = issues.filter((issue) => issue.severity === "major");
  const majorIdentityCount = majorIssues.filter((issue) => failMajorCategories.has(issue.category)).length;
  const majorHumanCount = majorIssues.filter((issue) => issue.category === "human_realism").length;
  const majorReferenceMatch = majorIssues.some((issue) => issue.category === "reference_match");
  const majorApparelIdentity = majorIssues.some((issue) => apparelIdentityCodes.has(issue.code.toLowerCase()));
  const status = criticalCount > 0 || majorIdentityCount >= 2 || majorHumanCount >= 2 || majorReferenceMatch || majorApparelIdentity || majorIssues.some((issue) => issue.code === "different_product" || issue.code === "severe_physical_failure")
    ? "fail"
    : issues.length > 0 ? "pass_with_warnings" : "pass";
  const severity = criticalCount > 0 ? "critical" : majorIssues.length > 0 ? "major" : issues.length > 0 ? "minor" : null;
  const retryRecommended = status === "fail" || issues.some((issue) => retryCodes.has(issue.code.toLowerCase()));
  return {
    status,
    checks,
    issues,
    severity,
    retryRecommended,
    summary: status === "pass" ? "Product identity, physical integration, composition, and applied creative requirements are acceptable." :
      status === "pass_with_warnings" ? "The output is usable, with non-blocking fidelity warnings." :
      "The output should not be treated as a high-quality fidelity result.",
    version: FIDELITY_VALIDATION_VERSION,
  };
}

export function mapStructuredValidationOutput(value: unknown): FidelityValidationIssue[] {
  if (typeof value !== "object" || value === null) throw new Error("Fidelity validation output is not an object.");
  const raw = (value as { findings?: unknown }).findings;
  if (!Array.isArray(raw)) throw new Error("Fidelity validation output has no findings array.");
  return raw.filter(isIssue).map((issue) => {
    const code = issue.code.toLowerCase();
    const severity = criticalIdentityCodes.has(code) || criticalApparelIdentityCodes.has(code) || (issue.category === "human_realism" && criticalHumanCodes.has(code))
      ? "critical"
      : ((majorIdentityCodes.has(code) || apparelIdentityCodes.has(code)) || (issue.category === "human_realism" && majorHumanCodes.has(code))) && issue.severity === "minor" ? "major" : issue.severity;
    const category = (criticalIdentityCodes.has(code) || majorIdentityCodes.has(code) || apparelIdentityCodes.has(code)) ? "product_identity" as const : issue.category;
    return { ...issue, category, severity, sourceAuthoritative: true };
  });
}
