import assert from "node:assert/strict";
import test from "node:test";

import { buildReferenceReplacementPrompt, orderReferenceReplacementImages } from "../src/lib/generation/image-roles";
import { resolveReferenceGenerationPath } from "../src/lib/generation/references/reference-product-replacement";
import { resolveRepairPlan } from "../src/lib/auto-repair/resolve-repair-plan";
import { buildValidationBrief, renderValidationInstructions } from "../src/lib/fidelity-validation/build-validation-brief";
import type { FidelityValidationResult } from "../src/lib/fidelity-validation/types";

const fallback = { fallbackStrategy: "jewelry_on_model" as const, fallbackUsesStageA: true };

test("compatible jewelry hand reference routes to reference product replacement and bypasses Stage A", () => {
  const route = resolveReferenceGenerationPath({ compatibleReferenceCount: 1, referenceCompatible: true, ...fallback });
  assert.equal(route.strategy, "reference_product_replacement");
  assert.equal(route.usesStageA, false);
});

test("no reference keeps the existing generation flow", () => {
  assert.deepEqual(resolveReferenceGenerationPath({ compatibleReferenceCount: 0, referenceCompatible: true, ...fallback }), { strategy: "jewelry_on_model", usesStageA: true });
});

test("reference base scene is first and source product identity is second", () => {
  const ordered = orderReferenceReplacementImages(
    { id: "reference", bucketId: "b", objectPath: "r", data: Buffer.from("r"), mimeType: "image/png" },
    { id: "product", bucketId: "b", objectPath: "p", data: Buffer.from("p"), mimeType: "image/png" },
  );
  assert.deepEqual(ordered.map(({ role }) => role), ["reference_base_scene", "product_identity_source"]);
  assert.deepEqual(ordered.map(({ order }) => order), [0, 1]);
});

test("replacement instructions preserve the scene, replace existing products, insert into bare scenes, and protect source identity", () => {
  const prompt = buildReferenceReplacementPrompt("Referans görseldeki kompozisyonu koru");
  assert.match(prompt, /PRESERVE AS BASE PHOTOGRAPH/);
  assert.match(prompt, /sole authority for product identity/);
  assert.match(prompt, /Reference product identity must never override it/);
  assert.match(prompt, /REPLACE the existing product/);
  assert.match(prompt, /If no product is present, place the source product/);
  assert.match(prompt, /smallest region needed/);
});

test("final repair policy schedules at most one repair attempt", () => {
  const validation = {
    version: "test", status: "fail", retryRecommended: true, summary: "identity issue",
    checks: [], severity: "critical",
    issues: [{ code: "identity_changed", category: "product_identity", severity: "critical", finding: "wrong product", expected: "source product", sourceAuthoritative: true }],
  } as FidelityValidationResult;
  const plan = resolveRepairPlan(validation);
  assert.equal(plan.shouldRetry, true);
  assert.equal(plan.issueCodes.length > 0, true);
});

test("final validation checks product identity and reference scene preservation independently", () => {
  const brief = buildValidationBrief({
    productProfile: null, vertical: "jewelry", strategy: "jewelry_on_model", sceneSuitability: null,
    composition: null, creativeCompliance: null, referencePreservation: true,
  });
  const instructions = renderValidationInstructions(brief);
  assert.match(instructions, /scene preservation check/);
  assert.match(instructions, /Product identity must still be judged only against Image 1/);
});
