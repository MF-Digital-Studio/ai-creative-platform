import assert from "node:assert/strict";
import test from "node:test";

import { resolveSceneSuitability } from "../src/lib/scene-suitability/resolve-scene-suitability";
import type { ProductProfile } from "../src/lib/product-understanding/product-profile";

function profile(vertical: ProductProfile["vertical"], subcategory: string | null = null, targets: ProductProfile["interactionTargets"] = ["none"]): ProductProfile {
  const details = vertical === "jewelry"
    ? { jewelryType: subcategory ?? "jewelry", metalColorOrMaterial: null, centerStone: null, centerStoneShape: null, centerStoneColor: null, stoneCount: null, stoneLayout: null, settingStyle: null, bandOrChainStructure: null, bodyPlacementTarget: "finger" as const }
    : vertical === "watches"
      ? { caseShape: null, caseMaterialOrColor: null, dialColor: null, bezel: null, crownSide: "not_visible" as const, pushers: null, braceletOrStrap: null, indicesOrMarkers: null, dateWindow: null, subdials: null, dialBrandingRegions: [] }
      : vertical === "footwear"
        ? { shoeType: subcategory ?? "shoe", silhouette: null, upperMaterial: [], outsole: null, midsole: null, panelStructure: [], lacing: null, tongue: null, heel: null, logoRegions: [], colorBlocking: [] }
      : vertical === "bags"
        ? { bagType: "handbag", silhouette: "structured", proportions: null, bodyStructure: null, handleCount: 2, handleGeometry: "arched", handleAttachmentPoints: [], strapCount: 1, strapPlacement: [], strapWidth: null, strapLengthClass: null, closureType: null, flapOrOpeningShape: null, zipperLayout: [], pocketLayout: [], panelConstruction: [], stitchingPattern: null, pipingOrEdgeTreatment: null, hardwareLayout: [], hardwareColor: null, logoOrMonogramPlacement: [], material: null, materialTexture: null, colorBlocking: [], patternOrPrint: null, baseShape: null, baseFeetHardware: null, chainStrap: null, decorativeCharms: [], asymmetricDetails: [] }
      : vertical === "apparel"
          ? { garmentType: subcategory ?? "garment", primaryColor: null, artworkOrLogoLocations: [], closures: [], pocketStructure: [], hoodOrCollar: null, constructionDetails: [], identitySides: [] }
          : { packageType: subcategory ?? "cosmetic", packageGeometry: null, containerForm: "other" as const, closureOrDispenser: "none" as const, materialOpacity: "opaque" as const, liquidVisibility: "not_applicable" as const, labelRegions: [], logoRegions: [] };
  return {
    productId: "asset", schemaVersion: 1, analysisVersion: "test", vertical, subcategory,
    wearability: targets[0] === "none" ? "non_wearable" : "wearable", rigidity: "rigid", materials: [], dominantColors: [], productShape: "", identityCriticalAttributes: [],
    visibleBranding: { hasLogo: false, hasReadableText: false, hasArtwork: false, logoRegions: [], textRegions: [], artworkRegions: [] }, interactionTargets: targets, allowedTransformations: ["none"], forbiddenTransformations: ["geometry_redesign"], sceneAffinities: { recommendedSceneTags: [], discouragedSceneTags: [] }, confidence: { overall: 1 }, source: { model: "test", analysisVersion: "test", analyzedAt: "2026-10-01" },
    verticalAttributes: { vertical, details } as ProductProfile["verticalAttributes"],
  };
}

function resolve(productProfile: ProductProfile | null, userPrompt = "", preset?: string) {
  return resolveSceneSuitability({ productProfile, userPrompt, preset: preset ? { id: preset } : null, strategy: "rigid_product", vertical: productProfile?.vertical ?? "jewelry" });
}

test("ring hand and studio intents resolve to compatible jewelry scenes", () => {
  const ring = profile("jewelry", "ring", ["finger"]);
  assert.equal(resolve(ring, "zarif kadın elinde")?.selectedSceneFamily, "jewelry_on_body");
  assert.equal(resolve(ring, "premium studio")?.selectedSceneFamily, "jewelry_studio");
  assert.equal(resolve(ring, "woman")?.selectedSceneFamily, "jewelry_on_body");
});

test("vertical attributes and minimal direction provide deterministic safe defaults", () => {
  const ring = profile("jewelry", null, ["finger"]);
  assert.match(resolve(ring)?.selectedSceneFamily ?? "", /^jewelry_/);
  assert.equal(resolve(profile("jewelry"))?.selectedSceneFamily, "jewelry_studio");
  assert.equal(resolve(profile("watches"))?.selectedSceneFamily, "watch_studio");
  assert.equal(resolve(profile("footwear"))?.selectedSceneFamily, "footwear_studio");
  assert.equal(resolve(profile("apparel"))?.selectedSceneFamily, "apparel_studio");
  assert.equal(resolve(profile("cosmetics"))?.selectedSceneFamily, "cosmetics_studio");
});

test("all public vertical intent families remain physically compatible", () => {
  assert.equal(resolve(profile("watches", "watch", ["wrist"]), "bileğinde")?.selectedSceneFamily, "watch_on_wrist");
  assert.equal(resolve(profile("footwear", "sneaker", ["foot"]), "ayağında sokakta")?.selectedSceneFamily, "footwear_street");
  assert.equal(resolve(profile("apparel"), "street editorial")?.selectedSceneFamily, "apparel_street");
  assert.equal(resolve(profile("cosmetics"), "vanity")?.selectedSceneFamily, "cosmetics_vanity");
});

test("presets are mapped only within the product vertical and results are stable", () => {
  const ring = profile("jewelry", "ring", ["finger"]);
  assert.equal(resolve(ring, "", "jewelry-studio")?.selectedSceneFamily, "jewelry_studio");
  assert.notEqual(resolve(ring, "", "footwear-street-lifestyle")?.selectedSceneFamily, "footwear_street");
  assert.deepEqual(resolve(ring, "premium"), resolve(ring, "premium"));
});

test("missing ProductProfile can still use safe vertical and strategy data", () => {
  const result = resolveSceneSuitability({ userPrompt: "", vertical: "footwear", strategy: "rigid_product" });
  assert.equal(result?.selectedSceneFamily, "footwear_studio");
});
