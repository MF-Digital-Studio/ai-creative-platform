import assert from "node:assert/strict";
import test from "node:test";

import { compileCreativeComplianceDirection } from "../src/lib/creative-direction-compliance/compile-compliance-direction";
import { resolveCreativeCompliance } from "../src/lib/creative-direction-compliance/resolve-compliance";
import type { ProductProfile } from "../src/lib/product-understanding/product-profile";
import { buildImageGenerationPromptWithPolicy } from "../src/lib/generation/prompts/build-image-generation-prompt";

function profile(vertical: ProductProfile["vertical"], dominantColors: string[], details: Record<string, unknown>, targets: ProductProfile["interactionTargets"] = ["none"]): ProductProfile {
  return {
    productId: "asset-1", schemaVersion: 1, analysisVersion: "test", vertical, subcategory: null,
    wearability: targets[0] === "none" ? "non_wearable" : "wearable", rigidity: "rigid", materials: [], dominantColors,
    productShape: "test", identityCriticalAttributes: [],
    visibleBranding: { hasLogo: false, hasReadableText: false, hasArtwork: false, logoRegions: [], textRegions: [], artworkRegions: [] },
    interactionTargets: targets, allowedTransformations: ["none"], forbiddenTransformations: ["recolor"],
    sceneAffinities: { recommendedSceneTags: [], discouragedSceneTags: [] }, confidence: { overall: 1 },
    source: { model: "test", analysisVersion: "test", analyzedAt: "2026-10-01" },
    verticalAttributes: { vertical, details } as ProductProfile["verticalAttributes"],
  };
}

const ring = () => profile("jewelry", ["silver"], { jewelryType: "ring", metalColorOrMaterial: "silver", centerStone: true, centerStoneShape: "round", centerStoneColor: "clear", stoneCount: 1, stoneLayout: "center", settingStyle: "prong", bandOrChainStructure: "band", bodyPlacementTarget: "finger" }, ["finger", "hand"]);

test("jewelry creative requirements preserve black nails and reject gold identity changes", () => {
  const result = resolveCreativeCompliance({ userPrompt: "zarif kadın elinde, siyah ojeli, altın yüzük", productProfile: ring() });
  assert.equal(result.applied.some(({ value }) => value === "black nail polish"), true);
  assert.equal(result.rejected.some(({ status, value }) => status === "rejected_identity_conflict" && value.startsWith("gold")), true);
});

test("environment and compatible styling remain applied", () => {
  const result = resolveCreativeCompliance({ userPrompt: "red background, black sleeve, marble surface", productProfile: ring() });
  assert.equal(result.rejected.length, 0);
  assert.equal(result.requirements.some(({ value }) => value === "deep red background"), true);
  assert.equal(result.requirements.some(({ value }) => value === "marble surface"), true);
});

test("composition downgrades unsafe wide jewelry framing", () => {
  const result = resolveCreativeCompliance({
    userPrompt: "geniş moda çekimi, siyah ojeli",
    productProfile: ring(),
    composition: { framing: "close_up", subjectScale: "large", productDominance: "hero", cameraDistance: "close", preferredAngle: "three_quarter", depthOfField: "shallow_product_locked", negativeCompositionRules: [], source: "scene_template", version: "composition-intelligence-v1" },
  });
  assert.equal(result.adjustedForComposition.some(({ status }) => status === "adjusted_for_composition"), true);
  assert.equal(result.applied.some(({ value }) => value === "black nail polish"), true);
});

test("watch, footwear and apparel identity colors are protected", () => {
  assert.equal(resolveCreativeCompliance({ userPrompt: "blue dial", productProfile: profile("watches", ["green"], { dialColor: "green" }) }).rejected[0]?.status, "rejected_identity_conflict");
  assert.equal(resolveCreativeCompliance({ userPrompt: "make shoe black", productProfile: profile("footwear", ["white", "red"], { colorBlocking: ["white and red"] }) }).rejected[0]?.status, "rejected_identity_conflict");
  assert.equal(resolveCreativeCompliance({ userPrompt: "red dress", productProfile: profile("apparel", ["white"], { primaryColor: "white", artworkOrLogoLocations: [{ location: "chest", description: "artwork" }] }) }).rejected[0]?.status, "rejected_identity_conflict");
});

test("missing profile keeps non-identity requirements safe and resolution is deterministic", () => {
  const input = { userPrompt: "red background, marble surface" };
  const first = resolveCreativeCompliance(input);
  assert.deepEqual(first, resolveCreativeCompliance(input));
  assert.equal(first.applied.length, 2);
  assert.equal(resolveCreativeCompliance({ userPrompt: "marble surface" }).rejected.length, 0);
});

test("explicit requirements compile above enhancer direction and do not duplicate", () => {
  const compliance = resolveCreativeCompliance({ userPrompt: "siyah ojeli" });
  const direction = compileCreativeComplianceDirection(compliance);
  const prompt = buildImageGenerationPromptWithPolicy("Professional brief: natural manicure", "reference_edit", { creativeCompliance: compliance }).prompt;
  assert.match(direction, /black nail polish/);
  assert.equal((prompt.match(/black nail polish/g) ?? []).length, 1);
  assert.ok(prompt.indexOf("Creative requirements") < prompt.indexOf("Professional brief"));
});
