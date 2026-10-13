import assert from "node:assert/strict";
import test from "node:test";

import { resolveGenerationSemantics } from "../src/lib/generation/strategy/resolve-generation-semantics";
import { resolveCommercialFashionSafetyLayer } from "../src/lib/generation/prompts/commercial-fashion-normalizer";
import { resolveApparelFitPreservation } from "../src/lib/apparel-fit-preservation/resolve-apparel-fit-profile";
import { resolveHumanRealismPolicy } from "../src/lib/human-realism/human-realism-policy";
import { resolveGenerationStrategy } from "../src/lib/generation/strategy/generation-strategy";
import type { ProductProfile } from "../src/lib/product-understanding/product-profile";

function semantics(strategy: "fashion_on_model" | "rigid_product", input: { visibleHuman?: boolean; referenceHumanPresent?: boolean; productOnly?: boolean } = {}) {
  return resolveGenerationSemantics({ vertical: "apparel", strategy, visibleHuman: input.visibleHuman, referenceHumanPresent: input.referenceHumanPresent, presetHumanPresence: input.productOnly ? "none" : null, strictProductOnly: input.productOnly });
}

test("apparel human paths retain safety across preservation strategies and reference replacement", () => {
  for (const strategy of ["fashion_on_model", "rigid_product"] as const) {
    const flags = semantics(strategy, { visibleHuman: true, referenceHumanPresent: true });
    assert.equal(flags.requiresCommercialFashionSafety, true);
    assert.equal(resolveCommercialFashionSafetyLayer({ vertical: "apparel", requiresCommercialFashionSafety: flags.requiresCommercialFashionSafety }).applied, true);
  }
});

test("true apparel product-only paths disable wearable safeguards", () => {
  const flags = semantics("rigid_product", { productOnly: true });
  assert.equal(flags.requiresCommercialFashionSafety, false);
  assert.equal(flags.requiresApparelFit, false);
  assert.equal(flags.requiresHumanRealism, false);
});

test("rigid-product apparel worn by a human keeps fit and Human Realism V2", () => {
  const flags = semantics("rigid_product", { visibleHuman: true });
  const fit = resolveApparelFitPreservation({ profile: null, strategy: "rigid_product", vertical: "apparel", humanExpected: flags.expectsHuman, productOnly: flags.isProductOnly, sourceProductExists: true, requiresApparelFit: flags.requiresApparelFit });
  const human = resolveHumanRealismPolicy({ strategy: "rigid_product", vertical: "apparel", visibleHuman: true, expectsHuman: flags.requiresHumanRealism });
  assert.equal(fit.active, true);
  assert.equal(human.applied, true);
});

test("reference replacement does not disable identity lock or wearable policy inputs", () => {
  const flags = semantics("rigid_product", { referenceHumanPresent: true });
  assert.equal(flags.isWearableOnHuman, true);
  assert.equal(flags.requiresApparelFit, true);
  assert.equal(flags.requiresCommercialFashionSafety, true);
});

test("a human reference corrects a rigid apparel ProductProfile route to fashion_on_model", () => {
  const profile: ProductProfile = {
    productId: "jacket", schemaVersion: 1, analysisVersion: "test", vertical: "apparel", subcategory: "jacket",
    wearability: "non_wearable", rigidity: "rigid", materials: [], dominantColors: [], productShape: "jacket",
    identityCriticalAttributes: [], visibleBranding: { hasLogo: false, hasReadableText: false, hasArtwork: false, logoRegions: [], textRegions: [], artworkRegions: [] },
    interactionTargets: ["none"], allowedTransformations: ["none"], forbiddenTransformations: ["geometry_redesign"],
    sceneAffinities: { recommendedSceneTags: [], discouragedSceneTags: [] }, confidence: { overall: 1 },
    source: { model: "test", analysisVersion: "test", analyzedAt: "2026-10-12" },
    verticalAttributes: { vertical: "apparel", details: { garmentType: "jacket", primaryColor: null, closures: [], hoodOrCollar: null, pocketStructure: [], constructionDetails: [], artworkOrLogoLocations: [], identitySides: [] } },
  };
  const route = resolveGenerationStrategy({ productProfile: profile, referenceHumanPresent: true, userPrompt: "" });
  assert.equal(route.strategy, "fashion_on_model");
  assert.equal(route.reason, "product_profile");
});
