import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createCostTelemetry } from "../src/lib/generation/cost-telemetry";
import { readReferenceAnalysisCache } from "../src/lib/generation/references/reference-analysis-cache";

const styleBrief = {
  visualIntent: "Clean editorial", composition: { framing: "close", cameraAngle: "eye-level", cameraDistance: "near", subjectPlacement: "center" },
  lighting: { character: "soft", direction: "side", flashBehavior: null, ambientExposure: "balanced", contrast: "medium" }, environment: { setting: "studio", architecturalCharacter: null, surfaceCharacter: "matte" },
  color: { palette: "neutral", grading: "natural", saturation: "restrained" }, texture: { grain: "fine", sharpness: "natural", retouching: "minimal" }, depthOfField: "moderate", poseLanguage: null, realismCharacter: "photographic",
};

test("cost telemetry produces deterministic external call counts", () => {
  const scenarios = [
    { name: "one image pass", products: 1, references: 0, referenceCalls: 0, generations: 1, validations: 1, repairs: 0, total: 2 },
    { name: "four-view pass", products: 4, references: 0, referenceCalls: 0, generations: 1, validations: 1, repairs: 0, total: 2 },
    { name: "four-view reference pass", products: 4, references: 1, referenceCalls: 1, generations: 1, validations: 1, repairs: 0, total: 3 },
    { name: "targeted repair", products: 1, references: 0, referenceCalls: 0, generations: 1, validations: 2, repairs: 1, total: 4 },
    { name: "validation unavailable", products: 1, references: 0, referenceCalls: 0, generations: 1, validations: 1, repairs: 0, total: 2 },
  ];
  for (const scenario of scenarios) {
    const telemetry = createCostTelemetry({ productUnderstandingCalls: 0, referenceAnalysisCalls: scenario.referenceCalls, imageGenerationCalls: scenario.generations, validationCalls: scenario.validations, repairGenerationCalls: scenario.repairs, inputProductImageCount: scenario.products, inputReferenceCount: scenario.references, repairAttempted: scenario.repairs === 1, finalOutcome: scenario.name === "validation unavailable" ? "unverified" : "succeeded", validationOutcome: scenario.name === "validation unavailable" ? "validation_unavailable" : "pass" });
    assert.equal(telemetry.totalExternalAICalls, scenario.total, scenario.name);
  }
});

test("repair attempts are counted once as repair generation, including failed provider attempts", () => {
  const telemetry = createCostTelemetry({ productUnderstandingCalls: 0, referenceAnalysisCalls: 0, imageGenerationCalls: 1, validationCalls: 1, repairGenerationCalls: 1, inputProductImageCount: 1, inputReferenceCount: 0, repairAttempted: true, finalOutcome: "failed", validationOutcome: "not_completed" });
  assert.equal(telemetry.imageGenerationCalls, 1);
  assert.equal(telemetry.repairGenerationCalls, 1);
  assert.equal(telemetry.totalExternalAICalls, 3);
});

test("failed generation persistence retains attempted-call telemetry and measured stages", async () => {
  const source = await readFile("src/app/[locale]/dashboard/projects/[projectId]/generation-actions.ts", "utf8");
  const providerAttempt = source.indexOf("executionCounts.imageGenerationCalls += 1;\n    const result = await performance.measure(\"provider_initial\"");
  const failureTelemetry = source.indexOf("const failureCostTelemetry = createCostTelemetry");
  assert.ok(providerAttempt >= 0);
  assert.ok(failureTelemetry > providerAttempt);
  assert.match(source.slice(failureTelemetry), /finalOutcome: "failed"/);
  assert.match(source.slice(failureTelemetry), /stages: failureStageDurations/);
});

test("reference cache requires the same ordered assets, model, and version", () => {
  const cache = { version: 1, model: "vision-mini", orderedAssetIds: ["reference-1", "reference-2"], styleBrief, analyzedAt: "2026-10-09T00:00:00.000Z" };
  assert.ok(readReferenceAnalysisCache(cache, { version: 1, model: "vision-mini", orderedAssetIds: ["reference-1", "reference-2"] }));
  assert.equal(readReferenceAnalysisCache(cache, { version: 1, model: "vision-mini", orderedAssetIds: ["reference-2", "reference-1"] }), null);
  assert.equal(readReferenceAnalysisCache(cache, { version: 2, model: "vision-mini", orderedAssetIds: ["reference-1", "reference-2"] }), null);
});

test("multi-view registration analyzes only the primary product", async () => {
  const source = await readFile("src/app/[locale]/dashboard/projects/[projectId]/actions.ts", "utf8");
  assert.match(source, /if \(asset\.product_role === "primary"\)[\s\S]*triggerProductAnalysisAfterRegistration/);
  assert.match(source, /Supporting views are[\s\S]*identity evidence/);
});

test("validation-unavailable Image Edit is retained as unverified", async () => {
  const source = await readFile("src/app/[locale]/dashboard/projects/[projectId]/generation-actions.ts", "utf8");
  assert.match(source, /validateImageEditBestEffort/);
  assert.match(source, /validation\.status === "validation_unavailable" \? "unverified"/);
});
