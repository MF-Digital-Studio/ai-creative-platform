import assert from "node:assert/strict";
import test from "node:test";

import { resolveGenerationStrategy } from "../src/lib/generation/strategy/generation-strategy";
import {
  PRODUCT_PROFILE_ANALYSIS_VERSION,
  PRODUCT_PROFILE_SCHEMA_VERSION,
  type ProductProfile,
} from "../src/lib/product-understanding/product-profile";

function ringProfile(): ProductProfile {
  return {
    productId: "asset-ring",
    schemaVersion: PRODUCT_PROFILE_SCHEMA_VERSION,
    analysisVersion: PRODUCT_PROFILE_ANALYSIS_VERSION,
    vertical: "jewelry",
    subcategory: "ring",
    wearability: "wearable",
    rigidity: "rigid",
    materials: ["silver-colored metal"],
    dominantColors: ["silver"],
    productShape: "ring with a visible band",
    identityCriticalAttributes: [],
    visibleBranding: { hasLogo: false, hasReadableText: false, hasArtwork: false, logoRegions: [], textRegions: [], artworkRegions: [] },
    interactionTargets: ["finger"],
    allowedTransformations: ["perspective_change"],
    forbiddenTransformations: ["gemstone_count_change", "geometry_redesign"],
    sceneAffinities: { recommendedSceneTags: ["jewelry_macro"], discouragedSceneTags: [] },
    confidence: { overall: 0.95 },
    source: { model: "test", analysisVersion: PRODUCT_PROFILE_ANALYSIS_VERSION, analyzedAt: "2026-10-01T00:00:00.000Z" },
    verticalAttributes: {
      vertical: "jewelry",
      details: { jewelryType: "ring", metalColorOrMaterial: "silver-colored metal", centerStone: null, centerStoneShape: null, centerStoneColor: null, stoneCount: null, stoneLayout: null, settingStyle: null, bandOrChainStructure: "band", bodyPlacementTarget: "finger" },
    },
  };
}

test("ProductProfile overrides a conflicting apparel prompt and preset", () => {
  const result = resolveGenerationStrategy({
    productProfile: ringProfile(),
    preset: { id: "apparel", generationStrategyHint: "fashion_on_model" },
    userPrompt: "Put this hoodie on a fashion model",
  });

  assert.equal(result.strategy, "jewelry_still_life");
  assert.equal(result.reason, "product_profile");
});

test("a jewelry ring profile resolves to jewelry on a hand", () => {
  const result = resolveGenerationStrategy({
    productProfile: ringProfile(),
    userPrompt: "Show the ring naturally on a woman's hand and finger.",
  });

  assert.equal(result.strategy, "jewelry_on_model");
  assert.equal(result.effectivePreservationMode, "reference_edit");
});

test("a jewelry profile without on-body intent remains a still life", () => {
  const result = resolveGenerationStrategy({ productProfile: ringProfile(), userPrompt: "Luxury macro on an ivory surface" });

  assert.equal(result.strategy, "jewelry_still_life");
});

test("invalid or missing ProductProfile retains legacy prompt routing", () => {
  const missing = resolveGenerationStrategy({ userPrompt: "Put this hoodie on a model" });
  const invalid = resolveGenerationStrategy({ productProfile: { vertical: "jewelry" }, userPrompt: "Put this hoodie on a model" });

  assert.equal(missing.strategy, "fashion_on_model");
  assert.equal(invalid.strategy, "fashion_on_model");
  assert.equal(invalid.reason, "prompt_intent");
});
