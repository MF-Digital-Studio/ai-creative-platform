import assert from "node:assert/strict";
import test from "node:test";

import { resolveComposition } from "../src/lib/composition-intelligence/resolve-composition";
import type { ProductProfile } from "../src/lib/product-understanding/product-profile";
import type { SceneFamily } from "../src/lib/scene-suitability/types";

function product(vertical: ProductProfile["vertical"]): ProductProfile {
  const details = vertical === "jewelry" ? { jewelryType: "ring", metalColorOrMaterial: null, centerStone: null, centerStoneShape: null, centerStoneColor: null, stoneCount: null, stoneLayout: null, settingStyle: null, bandOrChainStructure: null, bodyPlacementTarget: "finger" as const }
    : vertical === "watches" ? { caseShape: null, caseMaterialOrColor: null, dialColor: null, bezel: null, crownSide: "not_visible" as const, pushers: null, braceletOrStrap: null, indicesOrMarkers: null, dateWindow: null, subdials: null, dialBrandingRegions: [] }
      : vertical === "bags" ? { bagType: "handbag", silhouette: "structured", proportions: null, bodyStructure: null, handleCount: 2, handleGeometry: "arched", handleAttachmentPoints: [], strapCount: 1, strapPlacement: [], strapWidth: null, strapLengthClass: null, closureType: null, flapOrOpeningShape: null, zipperLayout: [], pocketLayout: [], panelConstruction: [], stitchingPattern: null, pipingOrEdgeTreatment: null, hardwareLayout: [], hardwareColor: null, logoOrMonogramPlacement: [], material: null, materialTexture: null, colorBlocking: [], patternOrPrint: null, baseShape: null, baseFeetHardware: null, chainStrap: null, decorativeCharms: [], asymmetricDetails: [] }
      : vertical === "footwear" ? { shoeType: "sneaker", silhouette: null, upperMaterial: [], outsole: null, midsole: null, panelStructure: [], lacing: null, tongue: null, heel: null, logoRegions: [], colorBlocking: [] }
        : vertical === "apparel" ? { garmentType: "jacket", primaryColor: null, artworkOrLogoLocations: [], closures: [], pocketStructure: [], hoodOrCollar: null, constructionDetails: [], identitySides: ["front" as const] }
          : { packageType: "serum", packageGeometry: null, containerForm: "bottle" as const, closureOrDispenser: "pump" as const, materialOpacity: "opaque" as const, liquidVisibility: "not_applicable" as const, labelRegions: [], logoRegions: [] };
  return { productId: "a", schemaVersion: 1, analysisVersion: "test", vertical, subcategory: vertical === "jewelry" ? "ring" : null, wearability: vertical === "jewelry" ? "wearable" : "non_wearable", rigidity: "rigid", materials: [], dominantColors: [], productShape: "", identityCriticalAttributes: [], visibleBranding: { hasLogo: false, hasReadableText: false, hasArtwork: false, logoRegions: [], textRegions: [], artworkRegions: [] }, interactionTargets: vertical === "jewelry" ? ["finger"] : ["none"], allowedTransformations: ["none"], forbiddenTransformations: ["geometry_redesign"], sceneAffinities: { recommendedSceneTags: [], discouragedSceneTags: [] }, confidence: { overall: 1 }, source: { model: "test", analysisVersion: "test", analyzedAt: "2026-10-01" }, verticalAttributes: { vertical, details } as ProductProfile["verticalAttributes"] };
}

function resolve(vertical: ProductProfile["vertical"], sceneFamily: SceneFamily, userPrompt = "") {
  return resolveComposition({ productProfile: product(vertical), sceneFamily, userPrompt });
}

test("jewelry on-body preserves close hero visibility and rejects full-body widening", () => {
  const result = resolve("jewelry", "jewelry_on_body", "full body fashion shot");
  assert.equal(result?.framing, "close_up");
  assert.equal(result?.productDominance, "hero");
  assert.match(result?.negativeCompositionRules.join(" ") ?? "", /full-body/i);
});

test("macro intent and jewelry studio retain inspectable product composition", () => {
  assert.equal(resolve("jewelry", "jewelry_on_body", "macro detay")?.framing, "close_up");
  const studio = resolve("jewelry", "jewelry_studio", "macro");
  assert.equal(studio?.framing, "macro");
  assert.equal(studio?.productDominance, "hero");
});

test("vertical templates keep the correct product visually dominant", () => {
  assert.equal(resolve("watches", "watch_on_wrist")?.framing, "close_up");
  assert.equal(resolve("watches", "watch_studio")?.framing, "full_product");
  assert.equal(resolve("footwear", "footwear_on_foot")?.preferredAngle, "low");
  assert.match(resolve("footwear", "footwear_street")?.negativeCompositionRules.join(" ") ?? "", /contextual/i);
  assert.equal(resolve("apparel", "apparel_studio")?.productDominance, "primary");
  assert.match(resolve("apparel", "apparel_street")?.negativeCompositionRules.join(" ") ?? "", /environment/i);
  assert.equal(resolve("cosmetics", "cosmetics_studio")?.productDominance, "hero");
  assert.match(resolve("cosmetics", "cosmetics_vanity")?.negativeCompositionRules.join(" ") ?? "", /props/i);
});

test("reference composition can refine only compatible product scenes and outputs are stable", () => {
  const referenceStyle = { composition: { framing: "macro close-up", cameraDistance: "close", cameraAngle: "", subjectPlacement: "" } } as never;
  const macro = resolveComposition({ productProfile: product("jewelry"), sceneFamily: "jewelry_studio", userPrompt: "", referenceStyle });
  assert.equal(macro?.framing, "macro");
  const ring = resolveComposition({ productProfile: product("jewelry"), sceneFamily: "jewelry_on_body", userPrompt: "", referenceStyle });
  assert.equal(ring?.framing, "close_up");
  assert.deepEqual(ring, resolveComposition({ productProfile: product("jewelry"), sceneFamily: "jewelry_on_body", userPrompt: "", referenceStyle }));
});

test("missing ProductProfile receives a safe strategy composition and adjectives do not alter it", () => {
  const input = { strategy: "footwear_on_model" as const, userPrompt: "premium cinematic" };
  assert.equal(resolveComposition(input)?.framing, "medium_close");
  assert.deepEqual(resolveComposition(input), resolveComposition(input));
});

test("generic bag composition heuristics cannot turn a selected Studio family into a portrait", () => {
  const studio = resolveComposition({ productProfile: product("bags"), sceneFamily: "bags_studio", userPrompt: "close-up", presetId: "bags-studio" });
  assert.equal(studio?.framing, "full_product");
  assert.equal(studio?.productDominance, "hero");
});
