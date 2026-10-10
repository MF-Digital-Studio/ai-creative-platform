import assert from "node:assert/strict";
import test from "node:test";

import { mapStructuredValidationOutput, resolveQualityGate, suppressReferenceAuthorityPresetIssues } from "../src/lib/fidelity-validation/resolve-quality-gate";
import type { FidelityValidationBrief, FidelityValidationIssue, FidelityValidationResult } from "../src/lib/fidelity-validation/types";
import { renderValidationInstructions } from "../src/lib/fidelity-validation/build-validation-brief";

function issue(overrides: Partial<FidelityValidationIssue>): FidelityValidationIssue {
  return {
    code: "warning",
    category: "realism",
    severity: "minor",
    finding: "A non-blocking visual difference was observed.",
    expected: "Keep the source product visually consistent.",
    sourceAuthoritative: true,
    issueCode: overrides.code ?? "warning",
    confidence: 0.92,
    identityImpact: overrides.identityImpact ?? (overrides.severity === "critical" && overrides.category === "product_identity" ? "critical" : ["product_identity", "geometry"].includes(overrides.category ?? "") ? "major" : "none"),
    likelyCause: "unknown",
    ...overrides,
  };
}

test("critical issue fails the quality gate", () => {
  assert.equal(resolveQualityGate([issue({ code: "different_product", severity: "critical", category: "product_identity" })]).status, "fail");
});

test("bag Studio scene mismatch is a meaningful failure and gets scene-only repair eligibility", async () => {
  const mismatch = resolveQualityGate([issue({ code: "bag_preset_scene_mismatch", category: "composition_visibility", severity: "critical", identityImpact: "none", confidence: 0.9 })]);
  assert.equal(mismatch.status, "fail");
  const { resolveRepairEligibility } = await import("../src/lib/generation/execution-policy/resolve-repair-eligibility");
  const eligibility = resolveRepairEligibility({ validation: mismatch, exactProduct: false, hybridProjectionApplied: false, maximumAttemptsRemaining: true });
  assert.equal(eligibility.eligible, true);
  assert.equal(eligibility.reason, "high_confidence_preset_scene_correction");
});

test("preset scene and interaction mismatches fail the quality gate while generic environments are major", () => {
  for (const code of ["PRESET_SCENE_MISMATCH", "PRESET_INTERACTION_MISMATCH", "PRESET_PRESENTATION_MODE_MISMATCH", "PRODUCT_ONLY_MODE_HUMAN_LEAK", "PRODUCT_ONLY_MODE_ENVIRONMENT_LEAK"]) {
    const result = resolveQualityGate([issue({ code, category: "composition_visibility", severity: "critical", identityImpact: "none", confidence: 0.92 })]);
    assert.equal(result.status, "fail", code);
  }
  const generic = resolveQualityGate([issue({ code: "PRESET_ENVIRONMENT_TOO_GENERIC", category: "composition_visibility", severity: "major", identityImpact: "none", confidence: 0.9 })]);
  assert.equal(generic.status, "fail");
  const collapse = resolveQualityGate([issue({ code: "PRESET_VARIATION_COLLAPSE", category: "composition_visibility", severity: "major", identityImpact: "none", confidence: 0.9 })]);
  assert.equal(collapse.status, "fail");
});

test("binding product-only studio validation explicitly rejects human and environment leakage", () => {
  const brief: FidelityValidationBrief = {
    vertical: "apparel", strategy: "rigid_product", sourceAuthority: "source", referencePreservation: true,
    productProfile: null, sceneSuitability: null, composition: null, appliedRequirements: [], allowedTransformations: [], verticalChecks: [],
    preset: { familyId: "apparel-studio", variantId: "fabric-motion", presentationMode: "fabric_motion", humanPresence: "none", interactionMode: "product_only", strictProductOnlyStudio: true },
  };
  const instructions = renderValidationInstructions(brief);
  assert.match(instructions, /PRODUCT_ONLY_MODE_HUMAN_LEAK/);
  assert.match(instructions, /PRODUCT_ONLY_MODE_ENVIRONMENT_LEAK/);
});

test("reference authority suppresses only preset fields explicitly overridden by the reference", () => {
  const presetIssue = issue({ code: "PRESET_SCENE_MISMATCH", category: "composition_visibility", severity: "critical", identityImpact: "none" });
  const identityIssue = issue({ code: "PRODUCT_IDENTITY_DRIFT", category: "product_identity", severity: "critical", identityImpact: "critical" });
  const filtered = suppressReferenceAuthorityPresetIssues([presetIssue, identityIssue], true, ["environment"]);
  assert.deepEqual(filtered.map(({ code }) => code), ["PRODUCT_IDENTITY_DRIFT"]);
  assert.equal(resolveQualityGate(filtered).status, "fail");
});

test("bag validator enforces human-free Studio and Aesthetic Environment families", () => {
  const baseBrief: Omit<FidelityValidationBrief, "preset"> = {
    vertical: "bags", strategy: "rigid_product", sourceAuthority: "source", referencePreservation: false,
    productProfile: null, sceneSuitability: null, composition: null, appliedRequirements: [],
    allowedTransformations: [], verticalChecks: [],
  };
  const studio = renderValidationInstructions({ ...baseBrief, preset: { familyId: "bags-studio", variantId: "white" } });
  const lifestyle = renderValidationInstructions({ ...baseBrief, preset: { familyId: "bags-lifestyle", variantId: "cafe-table" } });
  assert.match(studio, /person, hand, worn bag, body contact/i);
  assert.match(studio, /BAG_PRESET_SCENE_MISMATCH/i);
  assert.match(lifestyle, /person, hand, worn bag, body contact/i);
  assert.match(lifestyle, /BAG_PRESET_SCENE_MISMATCH/i);
  const overridden = renderValidationInstructions({ ...baseBrief, strategy: "bags_on_model", preset: { familyId: "bags-lifestyle", variantId: "cafe-table" } });
  assert.doesNotMatch(overridden, /Bag Aesthetic Environment compliance gate/i);
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

test("vertical finding codes remain available with calibrated context", () => {
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
    assert.equal(result.issues[0]?.confidence, 0.92);
    assert.ok(result.issues[0]?.likelyCause);
  }
});

test("calibration fixtures tolerate natural changes and reject identity changes", () => {
  const fixture = (code: string, category: FidelityValidationIssue["category"], severity: FidelityValidationIssue["severity"], identityImpact: FidelityValidationIssue["identityImpact"], likelyCause: FidelityValidationIssue["likelyCause"] = "source_identity_drift") => ({
    code, issueCode: code, category, severity, finding: code, expected: "preserve source identity", confidence: 0.94, identityImpact, likelyCause, sourceAuthoritative: true,
  });
  const cases: Array<[string, FidelityValidationIssue, FidelityValidationIssue["severity"], FidelityValidationResult["status"]]> = [
    ["small branded chest logo mild shift", fixture("APPAREL_ARTWORK_PLACEMENT_DRIFT", "product_identity", "minor", "minor", "perspective"), "minor", "pass_with_warnings"],
    ["wrong logo", fixture("WRONG_LOGO", "product_identity", "minor", "critical"), "critical", "fail"],
    ["large complex hoodie typography corruption", fixture("APPAREL_ARTWORK_TEXT_DRIFT", "product_identity", "major", "critical", "typography_change"), "critical", "fail"],
    ["garment fold distortion", fixture("FABRIC_DEFORMATION", "geometry", "minor", "minor", "fabric_deformation"), "minor", "pass_with_warnings"],
    ["necklace chain fall variation", fixture("CHAIN_FALL_VARIATION", "body_interaction", "minor", "none", "body_interaction"), "minor", "pass_with_warnings"],
    ["necklace pendant geometry", fixture("PENDANT_GEOMETRY_CHANGED", "product_identity", "major", "critical", "geometry_change"), "critical", "fail"],
    ["watch wrist perspective", fixture("WRIST_ANGLE_VARIATION", "realism", "minor", "none", "perspective"), "minor", "pass_with_warnings"],
    ["watch wrong dial geometry", fixture("WATCH_DIAL_STRUCTURE_CHANGED", "product_identity", "major", "critical", "geometry_change"), "critical", "fail"],
    ["footwear flex", fixture("FOOTWEAR_FLEX", "geometry", "minor", "minor", "fabric_deformation"), "minor", "pass_with_warnings"],
    ["footwear silhouette drift", fixture("FOOTWEAR_SILHOUETTE_CHANGED", "product_identity", "major", "critical", "geometry_change"), "critical", "fail"],
    ["cosmetics reflections", fixture("COSMETICS_REFLECTION_VARIATION", "realism", "minor", "none", "lighting"), "minor", "pass_with_warnings"],
    ["cosmetics label identity", fixture("BRANDING_CORRUPTED", "product_identity", "major", "critical", "typography_change"), "critical", "fail"],
  ];
  for (const [name, input, severity, status] of cases) {
    const [mapped] = mapStructuredValidationOutput({ findings: [input] });
    const result = resolveQualityGate([mapped!]);
    assert.equal(mapped?.severity, severity, name);
    assert.equal(result.status, status, name);
    assert.equal(result.commerciallyUsable, status !== "fail", name);
  }
});

test("low-confidence mild identity variation cannot become critical", () => {
  const [mapped] = mapStructuredValidationOutput({ findings: [{ code: "APPAREL_ARTWORK_PLACEMENT_DRIFT", category: "product_identity", severity: "critical", confidence: 0.32, identityImpact: "major", likelyCause: "perspective", finding: "slight shift", expected: "source placement" }] });
  const result = resolveQualityGate([mapped!]);
  assert.equal(mapped?.severity, "minor");
  assert.equal(result.status, "pass_with_warnings");
});

test("human realism findings stay separate from product identity", () => {
  const result = resolveQualityGate([
    issue({ code: "hand_anatomy_error", category: "human_realism", severity: "critical", identityImpact: "none", likelyCause: "body_interaction" }),
    issue({ code: "product_identity_drift", category: "product_identity", severity: "critical", identityImpact: "critical", likelyCause: "source_identity_drift" }),
  ]);
  assert.equal(result.status, "fail");
  assert.equal(result.commerciallyUsable, false);
  assert.deepEqual(new Set(result.issues.map(({ category }) => category)), new Set(["human_realism", "product_identity"]));
});

test("creative requirement issues are warnings or failures based on explicit severity", () => {
  const warning = resolveQualityGate([issue({ code: "decorative_mood_mismatch", category: "creative_requirement", severity: "minor" })]);
  const required = resolveQualityGate([issue({ code: "required_creative_missing", category: "creative_requirement", severity: "major" })]);
  assert.equal(warning.status, "pass_with_warnings");
  assert.equal(required.retryRecommended, false);
  assert.equal(required.status, "pass_with_warnings");
});
