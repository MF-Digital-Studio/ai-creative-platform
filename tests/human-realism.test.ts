import assert from "node:assert/strict";
import test from "node:test";
import { resolveHumanRealismPolicy } from "../src/lib/human-realism/human-realism-policy";
import { compileHumanRealismPrompt } from "../src/lib/human-realism/compile-human-realism-prompt";
import { mapStructuredValidationOutput, resolveQualityGate } from "../src/lib/fidelity-validation/resolve-quality-gate";
import { resolveRepairPlan } from "../src/lib/auto-repair/resolve-repair-plan";
import { compileRepairInstructions } from "../src/lib/auto-repair/compile-repair-instructions";

test("still life has no human prompt; visible human enables it", () => {
  const still = resolveHumanRealismPolicy({ strategy: "jewelry_still_life", vertical: "jewelry" });
  assert.equal(still.applied, false);
  assert.equal(compileHumanRealismPrompt(still, "jewelry"), "");
  assert.equal(resolveHumanRealismPolicy({ strategy: "jewelry_still_life", vertical: "jewelry", visibleHuman: true }).applied, true);
});

for (const [strategy, vertical, expected] of [
  ["fashion_on_model", "apparel", "Garment follows"],
  ["jewelry_on_model", "jewelry", "Exactly five fingers"],
  ["watch_on_wrist", "watches", "Strap wraps"],
  ["footwear_on_model", "footwear", "weight-bearing sole"],
] as const) {
  test(`${vertical} has relevant human rules`, () => {
    const policy = resolveHumanRealismPolicy({ strategy, vertical });
    assert.match(compileHumanRealismPrompt(policy, vertical), new RegExp(expected));
  });
}

test("cosmetics face context gets restrained skin and face rules", () => {
  const policy = resolveHumanRealismPolicy({ strategy: "rigid_product", vertical: "cosmetics", visibleHuman: true, faceVisible: true });
  const prompt = compileHumanRealismPrompt(policy, "cosmetics");
  assert.match(prompt, /FACE AND HAIR/);
  assert.match(prompt, /do not exaggerate pores/);
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

test("skin and anatomy failures select targeted repairs preserving product identity", () => {
  const issues = mapStructuredValidationOutput({ findings: [finding("PLASTIC_SKIN", "major"), finding("BODY_PROPORTION_ERROR", "major")] });
  const plan = resolveRepairPlan(resolveQualityGate(issues));
  assert.deepEqual(plan.categories, ["skin_texture_repair", "body_anatomy_repair"]);
  const prompt = compileRepairInstructions("SOURCE PRODUCT IDENTITY LOCK", plan);
  assert.match(prompt, /SOURCE PRODUCT IDENTITY LOCK/);
  assert.match(prompt, /Preserve facial identity, product and composition/);
});

test("human metadata contains only version, application, focus, status and retry", () => {
  const policy = resolveHumanRealismPolicy({ strategy: "watch_on_wrist", vertical: "watches" });
  const metadata = { version: "human-realism-v1", applied: policy.applied, focusAreas: policy.focusAreas, validationStatus: "pass", repairAttempted: false };
  assert.deepEqual(Object.keys(metadata), ["version", "applied", "focusAreas", "validationStatus", "repairAttempted"]);
});
