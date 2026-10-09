import assert from "node:assert/strict";
import test from "node:test";

import { buildImageGenerationPrompt } from "../src/lib/generation/prompts/build-image-generation-prompt";
import { resolveReferenceMatch } from "../src/lib/generation/references/resolve-reference-match";
import type { ReferenceShotProfile } from "../src/lib/generation/references/reference-shot-profile";
import { resolveQualityGate } from "../src/lib/fidelity-validation/resolve-quality-gate";
import { resolveRepairPlan } from "../src/lib/auto-repair/resolve-repair-plan";
import type { ProductProfile } from "../src/lib/product-understanding/product-profile";

const shot: ReferenceShotProfile = {
  framing: "close_up", cameraAngle: "three_quarter", cameraDistance: "close", subjectPlacement: "centered",
  productScale: "large", interaction: "held", humanPose: "hand enters from above", handDirection: "top",
  lighting: "low_key", background: "solid_color", environment: "studio", surfaces: "matte surface", props: "none",
  depthOfField: "shallow", negativeSpace: "none", realism: "commercial", compositionNotes: "centered macro campaign",
  nonTransferableIdentityFeatures: ["reference logo", "reference geometry", "reference color"],
};

function product(vertical: ProductProfile["vertical"]): ProductProfile {
  return {
    productId: "source", schemaVersion: 1, analysisVersion: "test", vertical, subcategory: null,
    wearability: vertical === "jewelry" ? "wearable" : "non_wearable", rigidity: "rigid", materials: ["metal"],
    dominantColors: ["silver"], productShape: "ring", identityCriticalAttributes: [], visibleBranding: {},
    interactionTargets: ["hand"], allowedTransformations: [], forbiddenTransformations: [],
    sceneAffinities: { recommendedSceneTags: [], discouragedSceneTags: [] }, confidence: { overall: 1 },
    source: { model: "test", analysisVersion: "test", analyzedAt: "2026-01-01" }, verticalAttributes: { vertical, details: {} },
  } as unknown as ProductProfile;
}

test("match transfers scene structure but blocks reference identity", () => {
  const result = resolveReferenceMatch({ productProfile: product("jewelry"), sceneFamily: "jewelry_on_body", composition: {
    framing: "close_up", subjectScale: "large", productDominance: "hero", cameraDistance: "close", preferredAngle: "three_quarter", depthOfField: "shallow_product_locked", negativeCompositionRules: [], source: "scene_template", version: "composition-intelligence-v1",
  }, reference: shot, mode: "match" });
  assert.ok(result?.compatible);
  assert.match(result?.transferableAttributes.join(" ") ?? "", /top|low_key|centered/i);
  assert.match(result?.blockedAttributes.join(" ") ?? "", /logo|geometry|color/i);
});

test("wide reference cannot shrink a ring or change scene compatibility", () => {
  const wide = { ...shot, cameraDistance: "wide" as const, productScale: "contextual" as const };
  const result = resolveReferenceMatch({ productProfile: product("jewelry"), sceneFamily: "jewelry_studio", reference: wide, mode: "match" });
  assert.equal(result?.compatible, false);
});

test("inspired is weaker than match and product identity remains first in prompt", () => {
  const inspired = resolveReferenceMatch({ productProfile: product("jewelry"), sceneFamily: "jewelry_on_body", reference: shot, mode: "inspired" });
  const matched = resolveReferenceMatch({ productProfile: product("jewelry"), sceneFamily: "jewelry_on_body", reference: shot, mode: "match" });
  assert.ok((inspired?.transferableAttributes.length ?? 0) < (matched?.transferableAttributes.length ?? 0));
  const prompt = buildImageGenerationPrompt("silver ring campaign", "reference_edit", { productProfile: product("jewelry"), referenceMatch: matched });
  assert.ok(prompt.indexOf("supplied product") < prompt.indexOf("REFERENCE MATCH"));
  assert.match(prompt, /Do not copy.*logo/i);
});

test("reference match validation issues map to the existing one-repair plan", () => {
  const validation = resolveQualityGate([{ code: "reference_composition_missed", category: "reference_match", severity: "major", finding: "wide output", expected: "centered close-up", sourceAuthoritative: false }]);
  assert.equal(validation.checks.find((check) => check.category === "reference_match")?.passed, false);
  const plan = resolveRepairPlan(validation);
  assert.equal(validation.status, "pass_with_warnings");
  assert.equal(validation.retryRecommended, false);
  assert.equal(plan.shouldRetry, false);
});

test("reference authority demotes conflicting preset scene rules to supporting aesthetics", () => {
  const matched = resolveReferenceMatch({ productProfile: product("jewelry"), sceneFamily: "jewelry_on_body", reference: shot, mode: "match" });
  const prompt = buildImageGenerationPrompt("editorial campaign", "reference_edit", {
    productProfile: product("jewelry"), referenceMatch: matched, referenceAuthority: true, presetFamilyId: "jewelry-studio",
    presetRules: { allowedSceneTypes: ["controlled_product_studio"], disallowedSceneTypes: ["people"], hardRules: ["No people"], softRules: ["Polished highlights"], variantId: "clean" },
  });
  assert.match(prompt, /Reference 1 has higher authority for scene, environment, composition, pose, camera, framing/i);
  assert.match(prompt, /Polished highlights/);
  assert.doesNotMatch(prompt, /Negative instructions: no people/i);
  assert.doesNotMatch(prompt, /Hard rules: No people/i);
});
