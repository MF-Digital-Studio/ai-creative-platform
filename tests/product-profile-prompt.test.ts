import assert from "node:assert/strict";
import test from "node:test";

import { buildImageGenerationPromptWithPolicy } from "../src/lib/generation/prompts/build-image-generation-prompt";
import { compileProductProfilePrompt } from "../src/lib/product-understanding/compile-product-profile-prompt";
import { PRODUCT_PROFILE_ANALYSIS_VERSION, PRODUCT_PROFILE_SCHEMA_VERSION, type ProductProfile } from "../src/lib/product-understanding/product-profile";

function profile(vertical: ProductProfile["vertical"], details: ProductProfile["verticalAttributes"]["details"], subcategory: string | null = null): ProductProfile {
  return {
    productId: "asset-1", schemaVersion: PRODUCT_PROFILE_SCHEMA_VERSION, analysisVersion: PRODUCT_PROFILE_ANALYSIS_VERSION,
    vertical, subcategory, wearability: "wearable", rigidity: "rigid", materials: [], dominantColors: ["silver"], productShape: "product",
    identityCriticalAttributes: [], visibleBranding: { hasLogo: false, hasReadableText: false, hasArtwork: false, logoRegions: [], textRegions: [], artworkRegions: [] },
    interactionTargets: ["finger"], allowedTransformations: ["perspective_change"], forbiddenTransformations: ["geometry_redesign"],
    sceneAffinities: { recommendedSceneTags: [], discouragedSceneTags: [] }, confidence: { overall: 0.9 },
    source: { model: "test", analysisVersion: PRODUCT_PROFILE_ANALYSIS_VERSION, analyzedAt: "2026-10-01T00:00:00.000Z" },
    verticalAttributes: { vertical, details } as ProductProfile["verticalAttributes"],
  };
}

const ring = () => profile("jewelry", { jewelryType: "ring", metalColorOrMaterial: "silver-colored", centerStone: true, centerStoneShape: "oval", centerStoneColor: "blue", stoneCount: 7, stoneLayout: "halo", settingStyle: "prong", bandOrChainStructure: "solid band", bodyPlacementTarget: "finger" }, null);

test("ring profile uses jewelryType fallback and physical finger placement", () => {
  const result = compileProductProfilePrompt(ring());
  assert.match(result.identity.join(" "), /silver-colored/i);
  assert.match(result.identity.join(" "), /stone layout: halo/i);
  assert.match(result.interaction.join(" "), /wrap naturally around a finger/i);
  assert.match(result.forbidden.join(" "), /floating or pasted-on ring/i);
});

test("profile identity precedes and wins over creative direction", () => {
  const result = buildImageGenerationPromptWithPolicy("Make this a minimal smooth gold ring with no stones.", "reference_edit", { strategy: "jewelry_on_model", useCase: "jewelry", productProfile: ring() });
  assert.ok(result.prompt.indexOf("silver-colored") < result.prompt.indexOf("minimal smooth gold ring"));
  assert.ok(result.prompt.indexOf("PRODUCT IDENTITY") < result.prompt.indexOf("Creative direction"));
  assert.equal(result.layers.productProfileApplied, true);
});

test("watch, footwear, apparel, and cosmetics compile their category identity", () => {
  const watch = compileProductProfilePrompt(profile("watches", { caseShape: "round", caseMaterialOrColor: "steel", dialColor: "green", bezel: "fixed", crownSide: "right", pushers: "two", braceletOrStrap: "link bracelet", indicesOrMarkers: "baton", dateWindow: "three o'clock", subdials: "none", dialBrandingRegions: [{ location: "dial", description: "logo" }] }));
  assert.match(watch.identity.join(" "), /green/i); assert.match(watch.interaction.join(" "), /wrist/i);
  const footwear = compileProductProfilePrompt(profile("footwear", { shoeType: "sneaker", silhouette: "low top", upperMaterial: ["leather"], outsole: "rubber", midsole: "foam", panelStructure: ["side panels"], lacing: "flat laces", tongue: "padded", heel: "reinforced", logoRegions: [], colorBlocking: ["white and blue"] }));
  assert.match(footwear.identity.join(" "), /outsole/i); assert.match(footwear.interaction.join(" "), /ground contact/i);
  const apparel = compileProductProfilePrompt(profile("apparel", { garmentType: "hoodie", primaryColor: "black", artworkOrLogoLocations: [{ location: "chest", description: "print" }], closures: ["zip"], pocketStructure: ["kangaroo"], hoodOrCollar: "hood", constructionDetails: ["seams"], identitySides: ["front"] }));
  assert.match(apparel.presentation.join(" "), /Natural fabric deformation/i); assert.match(apparel.forbidden.join(" "), /print relocation/i);
  const cosmetics = compileProductProfilePrompt(profile("cosmetics", { packageType: "serum", packageGeometry: "cylindrical", containerForm: "bottle", closureOrDispenser: "dropper", materialOpacity: "transparent", liquidVisibility: "visible", labelRegions: [{ location: "front", description: "label" }], logoRegions: [] }));
  assert.match(cosmetics.identity.join(" "), /package geometry/i); assert.match(cosmetics.forbidden.join(" "), /dispenser/i);
});

test("missing or invalid profile retains existing prompt behavior", () => {
  const missing = buildImageGenerationPromptWithPolicy("A product on a table", "pixel_lock");
  const invalid = buildImageGenerationPromptWithPolicy("A product on a table", "pixel_lock", { productProfile: { vertical: "jewelry" } });
  assert.equal(missing.layers.productProfileApplied, false);
  assert.equal(invalid.layers.productProfileApplied, false);
});
