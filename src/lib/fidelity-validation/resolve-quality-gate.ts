import type { FidelityValidationCheck, FidelityValidationIssue, FidelityValidationResult } from "./types";
import { FIDELITY_VALIDATION_VERSION } from "./validation-version";

const retryCodes = new Set(["identity_changed", "geometry_drift", "body_interaction_failure", "required_creative_missing", "structural_drift"]);
const failMajorCategories = new Set(["product_identity", "geometry", "body_interaction", "structural_integrity"]);
const validCategories = new Set(["product_identity", "geometry", "color_material", "branding_text", "body_interaction", "composition_visibility", "creative_requirement", "realism", "duplication", "structural_integrity"]);

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
  const allCategories = ["product_identity", "geometry", "color_material", "branding_text", "body_interaction", "composition_visibility", "creative_requirement", "realism", "duplication", "structural_integrity"] as const;
  const checks = allCategories.map((category) => checksByCategory.get(category) ?? {
    category,
    passed: true,
    finding: "No material issue reported.",
    issueCodes: [],
  });
  const criticalCount = issues.filter((issue) => issue.severity === "critical").length;
  const majorIssues = issues.filter((issue) => issue.severity === "major");
  const majorIdentityCount = majorIssues.filter((issue) => failMajorCategories.has(issue.category)).length;
  const status = criticalCount > 0 || majorIdentityCount >= 2 || majorIssues.some((issue) => issue.code === "different_product" || issue.code === "severe_physical_failure")
    ? "fail"
    : issues.length > 0 ? "pass_with_warnings" : "pass";
  const severity = criticalCount > 0 ? "critical" : majorIssues.length > 0 ? "major" : issues.length > 0 ? "minor" : null;
  const retryRecommended = status === "fail" || issues.some((issue) => retryCodes.has(issue.code));
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
  return raw.filter(isIssue).map((issue) => ({
    ...issue,
    sourceAuthoritative: true,
  }));
}
