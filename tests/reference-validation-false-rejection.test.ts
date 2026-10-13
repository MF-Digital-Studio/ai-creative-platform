import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { mapStructuredValidationOutput, resolveQualityGate, suppressReferenceAuthorityPresetIssues, suppressUnsupportedApparelArtworkIssues } from "../src/lib/fidelity-validation/resolve-quality-gate";
import type { FidelityValidationIssue } from "../src/lib/fidelity-validation/types";

function finding(code: string, overrides: Partial<FidelityValidationIssue> = {}): FidelityValidationIssue {
  return { code, category: "product_identity", severity: "critical", confidence: .96, identityImpact: "critical", likelyCause: "source_identity_drift", region: "garment", repairable: true, commercialImpact: "high", finding: "material mismatch", expected: "source product", sourceAuthoritative: true, ...overrides };
}

test("null and false artwork evidence cannot emit apparel artwork drift", () => {
  const artwork = finding("apparel_artwork_identity_drift");
  assert.deepEqual(suppressUnsupportedApparelArtworkIssues([artwork], null), []);
  assert.deepEqual(suppressUnsupportedApparelArtworkIssues([artwork], false), []);
});

test("confirmed artwork evidence retains a real artwork drift", () => {
  assert.equal(suppressUnsupportedApparelArtworkIssues([finding("apparel_artwork_identity_drift")], true).length, 1);
});

test("generic garment mismatch remains a non-artwork identity issue", () => {
  const issue = finding("apparel_silhouette_mismatch", { category: "apparel_fit", identityImpact: "major" });
  assert.equal(suppressUnsupportedApparelArtworkIssues([issue], null)[0]?.code, "apparel_silhouette_mismatch");
});

test("reference-overridden camera, framing, and environment mismatches are suppressed", () => {
  const overridden = ["cameraDistance", "cameraAngle", "framing", "environment"];
  for (const field of overridden) {
    const issue = finding("preset_presentation_mode_mismatch", { category: "composition_visibility", identityImpact: "none", presetMismatchFields: [field as "cameraDistance"] });
    assert.deepEqual(suppressReferenceAuthorityPresetIssues([issue], true, overridden), [], field);
  }
});

test("preserved human presence and interaction mismatches still fail", () => {
  const issues = [
    finding("preset_presentation_mode_mismatch", { category: "composition_visibility", identityImpact: "none", presetMismatchFields: ["humanPresence"] }),
    finding("preset_presentation_mode_mismatch", { category: "composition_visibility", identityImpact: "none", presetMismatchFields: ["interactionMode"] }),
  ];
  const surviving = suppressReferenceAuthorityPresetIssues(issues, true, ["framing"]);
  assert.equal(surviving.length, 2);
  assert.equal(resolveQualityGate(surviving).status, "fail");
});

test("structured preset mismatch records actual mismatching fields", () => {
  const [issue] = mapStructuredValidationOutput({ findings: [{ code: "PRESET_PRESENTATION_MODE_MISMATCH", category: "composition_visibility", severity: "critical", confidence: .95, identityImpact: "none", likelyCause: "unknown", region: "scene", repairable: true, commercialImpact: "high", finding: "camera and framing differ", expected: "reference-authoritative camera and framing", presetMismatchFields: ["cameraAngle", "framing"] }] });
  assert.deepEqual(issue?.presetMismatchFields, ["cameraAngle", "framing"]);
});

test("false artwork drift cannot reject the quality gate after evidence filtering", () => {
  assert.equal(resolveQualityGate(suppressUnsupportedApparelArtworkIssues([finding("apparel_artwork_identity_drift")], null)).status, "pass");
});

test("reference filtering is local and adds no provider call", () => {
  const source = readFileSync("src/lib/fidelity-validation/validate-generated-image.ts", "utf8");
  assert.equal((source.match(/client\.validate\(input, brief\)/g) ?? []).length, 2);
});
