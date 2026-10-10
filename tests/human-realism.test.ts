import assert from "node:assert/strict";
import test from "node:test";
import { resolveHumanRealismPolicy } from "../src/lib/human-realism/human-realism-policy";
import { compileHumanRealismPrompt } from "../src/lib/human-realism/compile-human-realism-prompt";
import { mapStructuredValidationOutput, resolveQualityGate } from "../src/lib/fidelity-validation/resolve-quality-gate";
import { resolveRepairPlan } from "../src/lib/auto-repair/resolve-repair-plan";
import { compileRepairInstructions } from "../src/lib/auto-repair/compile-repair-instructions";
import { buildValidationBrief, renderValidationInstructions } from "../src/lib/fidelity-validation/build-validation-brief";

test("still life has no human prompt; visible human enables it", () => {
  const still = resolveHumanRealismPolicy({ strategy: "jewelry_still_life", vertical: "jewelry" });
  assert.equal(still.applied, false);
  assert.equal(compileHumanRealismPrompt(still, "jewelry"), "");
  assert.equal(resolveHumanRealismPolicy({ strategy: "jewelry_still_life", vertical: "jewelry", visibleHuman: true }).applied, true);
});

test("product-only apparel receives no human fragment while human apparel does", () => {
  const productOnly = resolveHumanRealismPolicy({ strategy: "rigid_product", vertical: "apparel", visibleHuman: false });
  const onModel = resolveHumanRealismPolicy({ strategy: "fashion_on_model", vertical: "apparel" });
  assert.equal(compileHumanRealismPrompt(productOnly, "apparel"), "");
  assert.match(compileHumanRealismPrompt(onModel, "apparel"), /HUMAN REALISM/);
});

for (const [strategy, vertical, expected] of [
  ["fashion_on_model", "apparel", "Garment follows"],
  ["jewelry_on_model", "jewelry", "five fingers"],
  ["watch_on_wrist", "watches", "Strap wraps"],
  ["footwear_on_model", "footwear", "weight-bearing compression"],
] as const) {
  test(`${vertical} has relevant human rules`, () => {
    const policy = resolveHumanRealismPolicy({ strategy, vertical });
    assert.match(compileHumanRealismPrompt(policy, vertical), new RegExp(expected));
  });
}

test("cosmetics face context gets restrained skin and face rules", () => {
  const policy = resolveHumanRealismPolicy({ strategy: "rigid_product", vertical: "cosmetics", visibleHuman: true, faceVisible: true });
  const prompt = compileHumanRealismPrompt(policy, "cosmetics");
  assert.match(prompt, /FACE:.*HAIR:/);
  assert.match(prompt, /Natural microtexture/);
});

function finding(code: string, severity: "minor" | "major" | "critical") {
  return { code, category: "human_realism", severity, finding: code, expected: "Believable human anatomy." };
}

test("critical finger count fails; multiple major human issues fail", () => {
  const finger = mapStructuredValidationOutput({ findings: [finding("FINGER_COUNT_ERROR", "minor")] });
  assert.equal(finger[0].severity, "critical");
  assert.equal(resolveQualityGate(finger).status, "fail");
  const major = mapStructuredValidationOutput({ findings: [finding("PLASTIC_SKIN", "minor"), finding("BODY_PROPORTION_ERROR", "major")] });
  assert.equal(resolveQualityGate(major).status, "fail");
});

test("normalized malformed hands and feet hard fail while plastic skin remains a major quality issue", () => {
  for (const code of ["HAND_ANATOMY_ERROR", "FOOT_ANATOMY_ERROR", "VISIBLE_FINGER_COUNT_ERROR", "VISIBLE_TOE_COUNT_ERROR", "HUMAN_ANATOMY_ERROR"]) {
    const result = resolveQualityGate(mapStructuredValidationOutput({ findings: [{ ...finding(code, "critical"), confidence: 0.95 }] }));
    assert.equal(result.status, "fail", code);
  }
  const proportions = resolveQualityGate(mapStructuredValidationOutput({ findings: [{ ...finding("BODY_PROPORTION_ERROR", "critical"), confidence: 0.95 }] }));
  assert.equal(proportions.status, "fail");
  const skin = resolveQualityGate(mapStructuredValidationOutput({ findings: [{ ...finding("PLASTIC_SKIN_APPEARANCE", "minor"), confidence: 0.95 }] }));
  assert.equal(skin.issues[0]?.severity, "major");
  assert.equal(skin.status, "fail");
});

test("natural subtle facial asymmetry is not a validation failure", () => {
  assert.equal(resolveQualityGate(mapStructuredValidationOutput({ findings: [] })).status, "pass");
});

test("skin and anatomy failures select targeted repairs preserving product identity", () => {
  const issues = mapStructuredValidationOutput({ findings: [finding("PLASTIC_SKIN", "major"), finding("BODY_PROPORTION_ERROR", "major")] });
  const plan = resolveRepairPlan(resolveQualityGate(issues));
  assert.deepEqual(plan.categories, ["skin_texture_repair", "limb_anatomy_repair"]);
  const prompt = compileRepairInstructions("SOURCE PRODUCT IDENTITY LOCK", plan);
  assert.match(prompt, /SOURCE PRODUCT IDENTITY LOCK/);
  assert.match(prompt, /Preserve facial identity, product and composition/);
});

test("targeted normalized human repair preserves identity and composition", () => {
  const issues = mapStructuredValidationOutput({ findings: [{ ...finding("VISIBLE_FINGER_COUNT_ERROR", "critical"), confidence: 0.98 }] });
  const plan = resolveRepairPlan(resolveQualityGate(issues));
  assert.equal(plan.shouldRetry, true);
  const prompt = compileRepairInstructions("SOURCE PRODUCT IDENTITY LOCK", plan);
  assert.match(prompt, /Modify ONLY the affected human realism region/i);
  assert.match(prompt, /Reference 1 person identity/i);
  assert.match(prompt, /camera, framing, environment, lighting, and composition/i);
});

test("human metadata contains only version, application, focus, status and retry", () => {
  const policy = resolveHumanRealismPolicy({ strategy: "watch_on_wrist", vertical: "watches" });
  const metadata = { version: "human-realism-v2", applied: policy.applied, focusAreas: policy.focusAreas, validationStatus: "pass", repairAttempted: false };
  assert.deepEqual(Object.keys(metadata), ["version", "applied", "focusAreas", "validationStatus", "repairAttempted"]);
});

test("Human Realism reuses the shared fidelity validation brief without a separate validator", () => {
  const humanRealism = resolveHumanRealismPolicy({ strategy: "fashion_on_model", vertical: "apparel" });
  const brief = buildValidationBrief({
    productProfile: null,
    vertical: "apparel",
    strategy: "fashion_on_model",
    sceneSuitability: null,
    composition: null,
    creativeCompliance: null,
    humanRealism,
  });
  const instructions = renderValidationInstructions(brief);
  assert.match(instructions, /HUMAN_LIMB_ANATOMY_ERROR/);
  assert.match(instructions, /HUMAN_SKIN_PLASTIC/);
  assert.equal(brief.humanRealism, humanRealism);
});
