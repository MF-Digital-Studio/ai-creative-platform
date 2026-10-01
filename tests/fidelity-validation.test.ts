import assert from "node:assert/strict";
import test from "node:test";

import { mapStructuredValidationOutput, resolveQualityGate } from "../src/lib/fidelity-validation/resolve-quality-gate";
import type { FidelityValidationIssue } from "../src/lib/fidelity-validation/types";

function issue(overrides: Partial<FidelityValidationIssue>): FidelityValidationIssue {
  return {
    code: "warning",
    category: "realism",
    severity: "minor",
    finding: "A non-blocking visual difference was observed.",
    expected: "Keep the source product visually consistent.",
    sourceAuthoritative: true,
    ...overrides,
  };
}

test("critical issue fails the quality gate", () => {
  assert.equal(resolveQualityGate([issue({ code: "different_product", severity: "critical", category: "product_identity" })]).status, "fail");
});

test("multiple major identity issues fail the quality gate", () => {
  const result = resolveQualityGate([
    issue({ code: "identity_changed", severity: "major", category: "product_identity" }),
    issue({ code: "geometry_drift", severity: "major", category: "geometry" }),
  ]);
  assert.equal(result.status, "fail");
  assert.equal(result.retryRecommended, true);
});

test("minor issues produce pass with warnings and clean output passes", () => {
  assert.equal(resolveQualityGate([issue({})]).status, "pass_with_warnings");
  assert.equal(resolveQualityGate([]).status, "pass");
});

test("structured findings map deterministically and preserve source authority", () => {
  const raw = { findings: [{ code: "warped_sole", category: "geometry", severity: "major", finding: "The sole is warped.", expected: "Preserve outsole geometry." }] };
  const first = resolveQualityGate(mapStructuredValidationOutput(raw));
  const second = resolveQualityGate(mapStructuredValidationOutput(raw));
  assert.deepEqual(first, second);
  assert.equal(first.issues[0]?.sourceAuthoritative, true);
});

test("vertical findings cover jewelry, watches, footwear, apparel and cosmetics issue codes", () => {
  const scenarios: Array<[string, FidelityValidationIssue["category"]]> = [
    ["changed_stone_layout", "geometry"],
    ["changed_dial_layout", "geometry"],
    ["warped_sole", "structural_integrity"],
    ["moved_artwork", "branding_text"],
    ["changed_package_geometry", "geometry"],
  ];
  for (const [code, category] of scenarios) {
    const result = resolveQualityGate([issue({ code, category, severity: "major" })]);
    assert.equal(result.issues[0]?.code, code);
    assert.equal(result.issues[0]?.severity, "major");
  }
});

test("creative requirement issues are warnings or failures based on explicit severity", () => {
  const warning = resolveQualityGate([issue({ code: "decorative_mood_mismatch", category: "creative_requirement", severity: "minor" })]);
  const required = resolveQualityGate([issue({ code: "required_creative_missing", category: "creative_requirement", severity: "major" })]);
  assert.equal(warning.status, "pass_with_warnings");
  assert.equal(required.retryRecommended, true);
  assert.equal(required.status, "pass_with_warnings");
});
