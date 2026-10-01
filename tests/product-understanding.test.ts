import assert from "node:assert/strict";
import test from "node:test";

import {
  isProductProfile,
  PRODUCT_PROFILE_ANALYSIS_VERSION,
  PRODUCT_PROFILE_SCHEMA_VERSION,
  type ProductProfile,
} from "../src/lib/product-understanding/product-profile";
import type { ProductVerticalAttributes } from "../src/lib/product-understanding/vertical-attributes";
import { supportedVerticals } from "../src/lib/verticals/supported-verticals";

function profile(verticalAttributes: ProductProfile["verticalAttributes"]): ProductProfile {
  return {
    productId: "asset-1",
    schemaVersion: PRODUCT_PROFILE_SCHEMA_VERSION,
    analysisVersion: PRODUCT_PROFILE_ANALYSIS_VERSION,
    vertical: verticalAttributes.vertical,
    subcategory: null,
    wearability: "non_wearable",
    rigidity: "rigid",
    materials: [],
    dominantColors: [],
    productShape: "A clearly visible commercial product.",
    identityCriticalAttributes: [],
    visibleBranding: {
      hasLogo: false,
      hasReadableText: false,
      hasArtwork: false,
      logoRegions: [],
      textRegions: [],
      artworkRegions: [],
    },
    interactionTargets: ["none"],
    allowedTransformations: ["perspective_change", "lighting_or_reflection_change"],
    forbiddenTransformations: ["recolor", "geometry_redesign"],
    sceneAffinities: { recommendedSceneTags: [], discouragedSceneTags: [] },
    confidence: { overall: 0.9 },
    source: {
      model: "test-model",
      analysisVersion: PRODUCT_PROFILE_ANALYSIS_VERSION,
      analyzedAt: "2026-10-01T00:00:00.000Z",
    },
    verticalAttributes,
  };
}

test("every public vertical is valid in a ProductProfile", () => {
  for (const vertical of supportedVerticals) {
    const attributes: ProductVerticalAttributes = vertical === "apparel"
      ? { vertical, details: { garmentType: "shirt", primaryColor: null, artworkOrLogoLocations: [], closures: [], pocketStructure: [], hoodOrCollar: null, constructionDetails: [], identitySides: ["front"] } }
      : vertical === "jewelry"
        ? { vertical, details: { jewelryType: "ring", metalColorOrMaterial: null, centerStone: null, centerStoneShape: null, centerStoneColor: null, stoneCount: null, stoneLayout: null, settingStyle: null, bandOrChainStructure: null, bodyPlacementTarget: "none" } }
        : vertical === "watches"
          ? { vertical, details: { caseShape: null, caseMaterialOrColor: null, dialColor: null, bezel: null, crownSide: "not_visible", pushers: null, braceletOrStrap: null, indicesOrMarkers: null, dateWindow: null, subdials: null, dialBrandingRegions: [] } }
          : vertical === "cosmetics"
            ? { vertical, details: { packageType: "serum", packageGeometry: null, containerForm: "bottle", closureOrDispenser: "cap", materialOpacity: "opaque", liquidVisibility: "not_visible", labelRegions: [], logoRegions: [] } }
            : { vertical, details: { shoeType: "sneaker", silhouette: null, upperMaterial: [], outsole: null, midsole: null, panelStructure: [], lacing: null, tongue: null, heel: null, logoRegions: [], colorBlocking: [] } };
    assert.equal(isProductProfile(profile(attributes)), true);
  }
});

test("jewelry represents a silver, blue-stone ring worn on a finger", () => {
  const ring = profile({ vertical: "jewelry", details: { jewelryType: "ring", metalColorOrMaterial: "silver", centerStone: true, centerStoneShape: "round", centerStoneColor: "blue", stoneCount: 7, stoneLayout: "one center stone with six pavé side stones", settingStyle: "prong", bandOrChainStructure: "split shank band", bodyPlacementTarget: "finger" } });
  ring.wearability = "wearable";
  ring.interactionTargets = ["finger"];
  assert.equal(isProductProfile(ring), true);
});

test("watch represents dial, crown, bracelet, and date window", () => {
  const watch = profile({ vertical: "watches", details: { caseShape: "round", caseMaterialOrColor: "stainless steel", dialColor: "black", bezel: "fixed polished bezel", crownSide: "right", pushers: null, braceletOrStrap: "three-link steel bracelet", indicesOrMarkers: "applied baton markers", dateWindow: "three o'clock", subdials: null, dialBrandingRegions: [{ location: "upper dial", description: "brand mark" }] } });
  assert.equal(isProductProfile(watch), true);
});

test("apparel supports wearable, deformable semantics", () => {
  const apparel = profile({ vertical: "apparel", details: { garmentType: "hoodie", primaryColor: "black", artworkOrLogoLocations: [], closures: [], pocketStructure: ["kangaroo pocket"], hoodOrCollar: "hood", constructionDetails: ["ribbed cuff"], identitySides: ["front", "back"] } });
  apparel.wearability = "wearable";
  apparel.rigidity = "deformable";
  apparel.interactionTargets = ["torso"];
  apparel.allowedTransformations = ["natural_fabric_deformation", "body_fitting"];
  assert.equal(isProductProfile(apparel), true);
});

test("cosmetics supports rigid packaging semantics", () => {
  const cosmetic = profile({ vertical: "cosmetics", details: { packageType: "face serum", packageGeometry: "cylindrical", containerForm: "bottle", closureOrDispenser: "dropper", materialOpacity: "transparent", liquidVisibility: "visible", labelRegions: [], logoRegions: [] } });
  assert.equal(cosmetic.rigidity, "rigid");
  assert.equal(isProductProfile(cosmetic), true);
});

test("footwear supports an on-foot interaction target", () => {
  const shoe = profile({ vertical: "footwear", details: { shoeType: "running shoe", silhouette: "low-top", upperMaterial: ["mesh"], outsole: "rubber", midsole: "foam", panelStructure: ["reinforced toe panel"], lacing: "flat laces", tongue: "padded", heel: "structured heel counter", logoRegions: [], colorBlocking: ["white and blue"] } });
  shoe.wearability = "wearable";
  shoe.interactionTargets = ["foot"];
  shoe.allowedTransformations = ["natural_pose_flex", "perspective_change"];
  assert.equal(isProductProfile(shoe), true);
});

test("profile versions are required and invalid structures are rejected", () => {
  const valid = profile({ vertical: "jewelry", details: { jewelryType: "ring", metalColorOrMaterial: null, centerStone: null, centerStoneShape: null, centerStoneColor: null, stoneCount: null, stoneLayout: null, settingStyle: null, bandOrChainStructure: null, bodyPlacementTarget: "none" } });
  assert.equal(isProductProfile(valid), true);
  assert.equal(isProductProfile({ ...valid, schemaVersion: undefined }), false);
  assert.equal(isProductProfile({ ...valid, vertical: "beverage" }), false);
});
