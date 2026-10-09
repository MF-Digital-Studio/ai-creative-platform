import assert from "node:assert/strict";
import test from "node:test";

import { compileRepairInstructions } from "../src/lib/auto-repair/compile-repair-instructions";
import { resolveRepairPlan } from "../src/lib/auto-repair/resolve-repair-plan";
import { resolveFinalCandidateSelection, resolveGenerationTerminalDecision } from "../src/lib/auto-repair/select-final-attempt";
import { buildValidationBrief, renderValidationInstructions } from "../src/lib/fidelity-validation/build-validation-brief";
import { resolveQualityGate } from "../src/lib/fidelity-validation/resolve-quality-gate";
import type { FidelityValidationIssue, FidelityValidationResult } from "../src/lib/fidelity-validation/types";
import { buildImageGenerationPrompt } from "../src/lib/generation/prompts/build-image-generation-prompt";
import type { ProductProfile } from "../src/lib/product-understanding/types";

function footwearProfile(shoeType: string): ProductProfile {
  return {
    productId: "shoe", schemaVersion: 1, analysisVersion: "test", vertical: "footwear", subcategory: shoeType,
    wearability: "wearable", rigidity: "semi_rigid", materials: [], dominantColors: [], productShape: shoeType,
    identityCriticalAttributes: [], visibleBranding: { hasLogo: false, hasReadableText: false, hasArtwork: false, logoRegions: [], textRegions: [], artworkRegions: [] },
    interactionTargets: ["foot"], allowedTransformations: ["natural_pose_flex"], forbiddenTransformations: ["outsole_redesign"],
    sceneAffinities: { recommendedSceneTags: [], discouragedSceneTags: [] }, confidence: { overall: 1 },
    source: { model: "fixture", analysisVersion: "test", analyzedAt: "2026-10-09" },
    verticalAttributes: { vertical: "footwear", details: { shoeType, silhouette: null, upperMaterial: [], outsole: null, midsole: null, panelStructure: [], lacing: null, tongue: null, heel: shoeType.includes("heel") ? "high heel" : null, logoRegions: [], colorBlocking: [] } },
  };
}

function finding(code: string, findingText: string): FidelityValidationIssue {
  return { code, issueCode: code, category: "human_realism", severity: "major", finding: findingText, expected: "Five natural toes aligned with the sandal", sourceAuthoritative: true, confidence: .95, identityImpact: "none", likelyCause: "body_interaction" };
}

function validation(issues: FidelityValidationIssue[]): FidelityValidationResult { return resolveQualityGate(issues); }

function brief(profile: ProductProfile) {
  return buildValidationBrief({ productProfile: profile, vertical: "footwear", strategy: "footwear_on_model", sceneSuitability: null, composition: null, creativeCompliance: null });
}

test("open-toe heel with five correct toes passes and receives the hard prompt rule", () => {
  const profile = footwearProfile("open-toe strappy high heel");
  const prompt = buildImageGenerationPrompt("Street footwear campaign with visible feet", "reference_edit", { productProfile: profile, strategy: "footwear_on_model" });
  assert.match(prompt, /each visible foot must have exactly five toes/i);
  assert.match(renderValidationInstructions(brief(profile)), /VISIBLE_TOE_COUNT_ERROR/);
  assert.equal(validation([]).status, "pass");
});

test("open-toe heel with four visible toes fails the hard quality gate", () => {
  const result = validation([finding("VISIBLE_TOE_COUNT_ERROR", "Only four toes are visible on the exposed foot.")]);
  assert.equal(result.status, "fail");
  assert.equal(result.commerciallyUsable, false);
  assert.equal(result.issues[0]?.severity, "critical");
});

test("malformed or misaligned toes fail rather than pass with warnings", () => {
  for (const code of ["FOOT_ANATOMY_ERROR", "FOOTWEAR_FIT_MISMATCH"]) assert.equal(validation([finding(code, "The toes are merged or misaligned with the straps.")]).status, "fail", code);
  assert.equal(validation([{ ...finding("FOOTWEAR_FIT_MISMATCH", "Misaligned toes"), category: "body_interaction" }]).status, "fail");
});

test("closed-toe footwear does not activate open-toe rules", () => {
  const profile = footwearProfile("closed-toe sneaker");
  const prompt = buildImageGenerationPrompt("Street footwear campaign", "reference_edit", { productProfile: profile, strategy: "footwear_on_model" });
  assert.doesNotMatch(prompt, /OPEN-TOE FOOT ANATOMY/);
  assert.doesNotMatch(renderValidationInstructions(brief(profile)), /OPEN-TOE FOOTWEAR HARD GATE/);
});

test("anatomy repair is single-purpose and preserves shoe identity and scene", () => {
  const plan = resolveRepairPlan(validation([finding("VISIBLE_TOE_COUNT_ERROR", "Four visible toes")]));
  const prompt = compileRepairInstructions("ORIGINAL SHOE AND SCENE", plan);
  assert.equal(plan.shouldRetry, true);
  assert.deepEqual(plan.categories, ["human_anatomy_repair"]);
  assert.match(prompt, /shoe identity, straps, heel shape, outfit, pose, lighting, background, framing, and scene type unchanged/i);
  assert.match(prompt, /Repair only visible foot anatomy, toe count, toe spacing, and toe alignment/i);
});

test("failed anatomy candidate cannot appear as a successful output", () => {
  const failed = validation([finding("FOOT_ANATOMY_ERROR", "Malformed toes")]);
  const attempt = { attempt: 0 as const, imageData: Buffer.from("failed"), mimeType: "image/png", validation: failed, providerRequestId: null, preservationMode: "reference_edit" as const };
  const selected = resolveFinalCandidateSelection(attempt, null);
  assert.equal(selected.qualityGatePassed, false);
  assert.equal(selected.qualityRejected, true);
  assert.equal(resolveGenerationTerminalDecision({ validationStatus: selected.validationStatus, qualityGatePassed: selected.qualityGatePassed, commerciallyUsable: failed.commerciallyUsable }), "rejected");
});
