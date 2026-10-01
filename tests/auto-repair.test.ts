import assert from "node:assert/strict";
import test from "node:test";

import { compileRepairInstructions } from "../src/lib/auto-repair/compile-repair-instructions";
import { MAX_AUTO_REPAIR_ATTEMPTS } from "../src/lib/auto-repair/repair-version";
import { resolveRepairPlan } from "../src/lib/auto-repair/resolve-repair-plan";
import { selectFinalAttempt } from "../src/lib/auto-repair/select-final-attempt";
import type { GenerationAttempt } from "../src/lib/auto-repair/types";
import type { FidelityValidationIssue, FidelityValidationResult } from "../src/lib/fidelity-validation/types";

function issue(code: string, severity: FidelityValidationIssue["severity"] = "major"): FidelityValidationIssue {
  return { code, category: code === "floating_ring" ? "body_interaction" : "geometry", severity, finding: code, expected: "preserve source fidelity", sourceAuthoritative: true };
}

function validation(status: FidelityValidationResult["status"], issues: FidelityValidationIssue[] = [], retryRecommended = status === "fail"): FidelityValidationResult {
  return { status, issues, retryRecommended, checks: [], severity: issues[0]?.severity ?? null, summary: status, version: "fidelity-validation-v1" };
}

function attempt(status: FidelityValidationResult["status"], issues: FidelityValidationIssue[] = [], imageData = Buffer.from(status)): GenerationAttempt {
  return { attempt: 0, imageData, mimeType: "image/png", validation: validation(status, issues), providerRequestId: null, preservationMode: "reference_edit" };
}

test("pass, warning, unavailable, and non-recommended failures do not retry", () => {
  for (const result of [
    validation("pass"),
    validation("pass_with_warnings", [issue("decorative_mood_mismatch", "minor")], false),
    validation("validation_unavailable"),
    validation("fail", [issue("geometry_drift")], false),
  ]) {
    assert.equal(resolveRepairPlan(result).shouldRetry, false);
  }
});

test("repairable failures create a bounded repair plan", () => {
  const plan = resolveRepairPlan(validation("fail", [issue("floating_ring")]));
  assert.equal(plan.shouldRetry, true);
  assert.deepEqual(plan.categories, ["body_interaction_repair"]);
  assert.equal(plan.preserveExistingLayers, true);
  assert.equal(plan.version, "auto-repair-v1");
  assert.equal(MAX_AUTO_REPAIR_ATTEMPTS, 1);
});

test("issue mappings cover ring, stones, composition, nails, watch, footwear, and packaging", () => {
  const scenarios: Array<[string, string]> = [
    ["floating_ring", "body_interaction_repair"],
    ["stone_layout_changed", "identity_reinforcement"],
    ["product_too_small", "composition_repair"],
    ["black_nails_missing", "creative_requirement_repair"],
    ["changed_dial_layout", "identity_reinforcement"],
    ["warped_sole", "geometry_reinforcement"],
    ["package_geometry_changed", "geometry_reinforcement"],
  ];
  for (const [code, category] of scenarios) assert.deepEqual(resolveRepairPlan(validation("fail", [issue(code)])).categories, [category]);
});

test("repair prompt appends targeted instructions and preserves existing layers", () => {
  const plan = resolveRepairPlan(validation("fail", [issue("floating_ring"), issue("black_nails_missing")]));
  const prompt = compileRepairInstructions("PRODUCT PROFILE RULES\nSCENE RULES\nCOMPOSITION RULES", plan);
  assert.match(prompt, /PRODUCT PROFILE RULES/);
  assert.match(prompt, /SCENE RULES/);
  assert.match(prompt, /COMPOSITION RULES/);
  assert.match(prompt, /wrap naturally around the correct finger/i);
  assert.match(prompt, /black nail polish/i);
  assert.match(prompt, /Change only the failed dimensions/i);
});

test("repair pass beats original fail and repair warning beats original fail", () => {
  const original = attempt("fail", [issue("floating_ring")]);
  const repairPass = { ...attempt("pass", []), attempt: 1 as const, imageData: Buffer.from("repair") };
  const repairWarning = { ...attempt("pass_with_warnings", [issue("decorative_mood_mismatch", "minor")]), attempt: 1 as const };
  assert.equal(selectFinalAttempt(original, repairPass).attempt, 1);
  assert.equal(selectFinalAttempt(original, repairWarning).attempt, 1);
});

test("worse repair fail, unavailable repair, and ties keep original", () => {
  const original = attempt("fail", [issue("geometry_drift")]);
  const worse = { ...attempt("fail", [issue("geometry_drift"), issue("structural_drift")]), attempt: 1 as const };
  const unavailable = { ...attempt("validation_unavailable"), attempt: 1 as const };
  const tie = { ...attempt("fail", [issue("geometry_drift")]), attempt: 1 as const };
  assert.equal(selectFinalAttempt(original, worse).attempt, 0);
  assert.equal(selectFinalAttempt(original, unavailable).attempt, 0);
  assert.equal(selectFinalAttempt(original, null).attempt, 0);
  assert.equal(selectFinalAttempt(original, tie).attempt, 0);
});

test("failure selection prefers fewer critical, then major, then minor issues", () => {
  const original = attempt("fail", [issue("identity_changed", "critical"), issue("geometry_drift")]);
  const repair = { ...attempt("fail", [issue("geometry_drift")]), attempt: 1 as const };
  assert.equal(selectFinalAttempt(original, repair).attempt, 1);
});

test("repair attempt type preserves the existing preservation mode", () => {
  const original = attempt("fail", [issue("warped_sole")]);
  const repair = { ...attempt("pass"), attempt: 1 as const, preservationMode: "pixel_lock" as const };
  const selected = selectFinalAttempt(original, repair);
  assert.equal(selected.preservationMode, "pixel_lock");
  assert.equal(original.preservationMode, "reference_edit");
});
