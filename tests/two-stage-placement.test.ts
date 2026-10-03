import assert from "node:assert/strict";
import test from "node:test";

import { resolvePlacementStrategy } from "../src/lib/generation/placement/placement-strategy";
import { buildPlacementStageAPrompt, buildPlacementStageBPrompt } from "../src/lib/generation/placement/placement-prompts";
import { selectFinalAttempt } from "../src/lib/auto-repair/select-final-attempt";
import { resolveRepairPlan } from "../src/lib/auto-repair/resolve-repair-plan";
import type { GenerationAttempt } from "../src/lib/auto-repair/types";
import type { FidelityValidationResult } from "../src/lib/fidelity-validation/types";
import type { ProductIdentityManifest } from "../src/lib/product-identity/types";
import { buildPlacementReadinessRepairInstructions, mapPlacementReadinessResponse, unavailablePlacementReadiness } from "../src/lib/generation/placement/placement-readiness";
import { buildPlacementStageBInputs, buildProductFreePlacementStageAInputs } from "../src/lib/generation/placement/placement-inputs";
import { compilePlacementReferenceDirection, projectReferenceForPlacement } from "../src/lib/generation/placement/project-reference-for-placement";
import { buildPlacementAccessoryCleanupPrompt, buildPlacementSafeRecompositionPrompt, shouldRunPlacementAccessoryCleanup, shouldUsePlacementSafeRecomposition } from "../src/lib/generation/placement/accessory-cleanup";
import type { ReferenceShotProfile } from "../src/lib/generation/references/reference-shot-profile";

const manifest: ProductIdentityManifest = { version: "product-identity-lock-v2", vertical: "jewelry", subcategory: "ring", immutableAttributes: ["center stone"], geometryAnchors: ["band geometry"], colorMaterialAnchors: ["silver"], brandingAnchors: [], interactionSensitiveAttributes: ["finger"], allowedDeformations: ["perspective_change"], forbiddenChanges: ["setting change"] };
const validation = (issues: FidelityValidationResult["issues"]): FidelityValidationResult => ({ status: issues.length ? "fail" : "pass", checks: [], issues, severity: issues[0]?.severity ?? null, retryRecommended: issues.length > 0, summary: "test", version: "test" });
const attempt = (attemptNumber: 0 | 1, issues: FidelityValidationResult["issues"]): GenerationAttempt => ({ attempt: attemptNumber, imageData: Buffer.from(String(attemptNumber)), mimeType: "image/png", providerRequestId: null, preservationMode: "reference_edit", validation: validation(issues) });

function strategy(generationStrategy: "jewelry_on_model" | "jewelry_still_life" | "watch_on_wrist" | "footwear_on_model", vertical: "jewelry" | "watches" | "footwear", interactionTarget: "finger" | "wrist" | "foot") {
  return resolvePlacementStrategy({ vertical, generationStrategy, identityManifest: manifest, interactionTarget, sourceFidelityRisk: "high" });
}

test("identity-sensitive on-body routes use two stages and still life remains single pass", () => {
  assert.equal(strategy("jewelry_on_model", "jewelry", "finger"), "two_stage_identity_placement");
  assert.equal(strategy("watch_on_wrist", "watches", "wrist"), "two_stage_identity_placement");
  assert.equal(strategy("footwear_on_model", "footwear", "foot"), "two_stage_identity_placement");
  assert.equal(strategy("jewelry_still_life", "jewelry", "finger"), "single_pass");
});

test("stage A excludes product identity while stage B keeps the original source authoritative", () => {
  const stageA = buildPlacementStageAPrompt({ creativeDirection: "reference composition", strategy: "jewelry_on_model", referenceProfile: { framing: "close_up", cameraAngle: "three_quarter", cameraDistance: "close", subjectPlacement: "centered", handDirection: "right", lighting: "soft_diffused", background: "stone_surface", environment: "studio", surface: "stone", depthOfField: "shallow", negativeSpace: "none", realism: "photographic" } });
  const stageB = buildPlacementStageBPrompt({ creativeDirection: "reference composition", strategy: "jewelry_on_model", identityManifest: manifest });
  assert.match(stageA, /Do not generate, describe, recreate, infer, or substitute the final product identity/i);
  assert.doesNotMatch(stageA, /same center stone/i);
  assert.match(stageB, /ORIGINAL SOURCE PRODUCT.*highest authority/i);
  assert.match(stageB, /same center stone[\s\S]*side-stone structure[\s\S]*band geometry/i);
  assert.match(stageA, /Raw reference and source-product pixels are intentionally absent/i);
  assert.match(stageA, /match body pose and camera structure only/i);
  assert.doesNotMatch(stageB, /reference images only/i);
});

test("Stage A input isolation and Stage B source authority are deterministic", () => {
  const scene = { id: "scene", bucketId: "", objectPath: "", data: Buffer.from("scene"), mimeType: "image/png" };
  const product = { id: "product", bucketId: "", objectPath: "", data: Buffer.from("product"), mimeType: "image/png" };
  assert.deepEqual(buildProductFreePlacementStageAInputs(), []);
  assert.deepEqual(buildPlacementStageBInputs(scene, product).map(({ role, order }) => ({ role, order })), [
    { role: "generated_attempt", order: 0 },
    { role: "product_identity_source", order: 1 },
  ]);
});

test("ring, watch, and footwear Stage A prompts require a product-free target", () => {
  const jewelryPrompt = buildPlacementStageAPrompt({ creativeDirection: "x", strategy: "jewelry_on_model" });
  assert.match(jewelryPrompt, /close-up or macro-adjacent hand/i);
  assert.match(jewelryPrompt, /overriding any wider reference framing/i);
  assert.match(jewelryPrompt, /fourth finger must be clearly visible/i);
  assert.match(buildPlacementStageAPrompt({ creativeDirection: "x", strategy: "watch_on_wrist" }), /Do not generate a watch, bracelet, wrist accessory, or device/i);
  assert.match(buildPlacementStageAPrompt({ creativeDirection: "x", strategy: "footwear_on_model" }), /Do not generate a branded, identity-bearing, or competing shoe/i);
});

const referenceShot: ReferenceShotProfile = {
  framing: "close_up", cameraAngle: "three_quarter", cameraDistance: "close", subjectPlacement: "centered", productScale: "large", interaction: "worn", humanPose: "ring worn on woman's finger", handDirection: "left", lighting: "soft_diffused", background: "stone_surface", environment: "warm studio", surfaces: "matte stone", props: "gold jewelry", depthOfField: "shallow", negativeSpace: "right", realism: "photographic", compositionNotes: "diamond ring campaign", nonTransferableIdentityFeatures: [],
};

test("placement projection converts product-bearing interaction into body-only guidance", () => {
  const result = projectReferenceForPlacement({ shotProfile: referenceShot });
  assert.equal("bodyPose" in (result.profile ?? {}), false);
  const compiled = compilePlacementReferenceDirection(result.profile);
  assert.match(compiled, /framing close_up/i);
  assert.match(compiled, /soft_diffused lighting/i);
  assert.match(compiled, /stone_surface background/i);
  assert.doesNotMatch(compiled, /\b(ring|jewelry|diamond|gold|worn)\b/i);
  assert.equal(result.diagnostics.productTermsRemoved, true);
  assert.equal(result.diagnostics.droppedFieldNames.includes("humanPose"), true);
  assert.equal(result.diagnostics.retainedFieldNames.includes("lighting"), true);
});

test("normal reference rendering remains separate from the placement projection", () => {
  const projected = projectReferenceForPlacement({ shotProfile: referenceShot });
  assert.doesNotMatch(compilePlacementReferenceDirection(projected.profile), /product scale|interaction/i);
  assert.equal(referenceShot.productScale, "large");
  assert.equal(referenceShot.interaction, "worn");
});

test("strict validation rejects a similar-but-different ring and repair keeps source authority", () => {
  const issue = { code: "product_identity_drift", category: "product_identity" as const, severity: "critical" as const, finding: "similar ring", expected: "source ring", sourceAuthoritative: true };
  assert.equal(validation([issue]).status, "fail");
  const plan = resolveRepairPlan(validation([issue]));
  assert.equal(plan.shouldRetry, true);
  assert.match(plan.repairInstructions.join(" "), /source product identity/i);
  assert.equal(selectFinalAttempt(attempt(0, []), attempt(1, [issue])).attempt, 0);
  assert.equal(selectFinalAttempt(attempt(0, [issue]), attempt(1, [])).attempt, 1);
});

test("repair remains bounded to one attempt and stage A stays internal", () => {
  const plan = resolveRepairPlan(validation([{ code: "product_identity_drift", category: "product_identity", severity: "critical", finding: "wrong", expected: "source", sourceAuthoritative: true }]));
  assert.equal(plan.shouldRetry, true);
  assert.equal(attempt(0, []).attempt, 0);
  assert.equal(attempt(1, []).attempt, 1);
});

test("occluded ring finger reports safe retry diagnostics while an exposed finger passes", () => {
  const occluded = mapPlacementReadinessResponse({ issueCodes: ["TARGET_REGION_OCCLUDED"], retryRecommended: true, targetRegion: "ring_finger" }, "jewelry_on_model");
  const exposed = mapPlacementReadinessResponse({ issueCodes: [], retryRecommended: false, targetRegion: "ring_finger" }, "jewelry_on_model");
  assert.deepEqual(occluded.issues, ["TARGET_REGION_OCCLUDED"]);
  assert.equal(occluded.status, "fail");
  assert.equal(occluded.retryRecommended, true);
  assert.equal(exposed.status, "pass");
});

test("repairable readiness issues override a false provider retry recommendation", () => {
  for (const issue of ["UNWANTED_JEWELRY_PRESENT", "TARGET_REGION_NOT_VISIBLE"] as const) {
    assert.equal(mapPlacementReadinessResponse({ issueCodes: [issue], retryRecommended: false, targetRegion: "ring_finger" }, "jewelry_on_model").retryRecommended, true);
  }
  const repair = buildPlacementReadinessRepairInstructions(["UNWANTED_JEWELRY_PRESENT", "TARGET_REGION_NOT_VISIBLE"]);
  assert.match(repair.join(" "), /Remove all jewelry from the target finger and all accessories/i);
  assert.match(repair.join(" "), /complete ring finger is clearly visible/i);
});

test("accessory cleanup is bounded to a final accessory-only Stage A failure", () => {
  assert.equal(shouldRunPlacementAccessoryCleanup(["UNWANTED_JEWELRY_PRESENT"]), true);
  assert.equal(shouldRunPlacementAccessoryCleanup(["COMPETING_PRODUCT_PRESENT"]), true);
  assert.equal(shouldRunPlacementAccessoryCleanup(["UNWANTED_JEWELRY_PRESENT", "ANATOMY_IMPLAUSIBLE"]), false);
  assert.equal(shouldRunPlacementAccessoryCleanup(["UNWANTED_JEWELRY_PRESENT", "TARGET_REGION_OCCLUDED"]), false);
  assert.match(buildPlacementAccessoryCleanupPrompt(), /preserving the hand, pose, anatomy, skin, camera, lighting, framing, and environment exactly/i);
  assert.match(buildPlacementAccessoryCleanupPrompt(), /Do not change finger count, move the hand, alter the composition/i);
});

test("geometry failures switch the bounded retry to placement-safe recomposition", () => {
  assert.equal(shouldUsePlacementSafeRecomposition(["TARGET_REGION_NOT_VISIBLE"]), true);
  assert.equal(shouldUsePlacementSafeRecomposition(["TARGET_REGION_TOO_SMALL", "TARGET_REGION_OCCLUDED"]), true);
  assert.equal(shouldUsePlacementSafeRecomposition(["UNWANTED_JEWELRY_PRESENT"]), false);
  assert.match(buildPlacementSafeRecompositionPrompt(), /Do not preserve the previous hand geometry or exact reference pose/i);
  assert.match(buildPlacementSafeRecompositionPrompt(), /Preserve only lighting, environment, and broad visual mood/i);
});

test("readiness repairs are targeted, bounded, and reference-compatible", () => {
  const instructions = buildPlacementReadinessRepairInstructions(["UNWANTED_JEWELRY_PRESENT", "TARGET_REGION_TOO_SMALL", "REFERENCE_COMPOSITION_TOO_RESTRICTIVE"]);
  assert.match(instructions.join(" "), /Remove all jewelry from the target finger/i);
  assert.match(instructions.join(" "), /tighter hand-focused composition/i);
  assert.match(instructions.join(" "), /overall reference mood/i);
  assert.equal(buildPlacementReadinessRepairInstructions(["TARGET_REGION_OCCLUDED"]).length, 1);
});

test("unavailable readiness never requests a retry, while watch and footwear use their own targets", () => {
  assert.equal(unavailablePlacementReadiness("jewelry_on_model").retryRecommended, false);
  assert.equal(mapPlacementReadinessResponse({ issueCodes: [], retryRecommended: false, targetRegion: "wrist" }, "watch_on_wrist").targetRegion, "wrist");
  assert.equal(mapPlacementReadinessResponse({ issueCodes: ["UNSUITABLE_FOOT_ORIENTATION"], retryRecommended: true, targetRegion: "foot" }, "footwear_on_model").status, "fail");
});
