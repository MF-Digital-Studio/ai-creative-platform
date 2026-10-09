import assert from "node:assert/strict";
import test from "node:test";

import { resolveSceneSuitability } from "../src/lib/scene-suitability/resolve-scene-suitability";
import type { ProductProfile } from "../src/lib/product-understanding/product-profile";
import type { ReferenceStyleBrief } from "../src/lib/generation/references/reference-style-brief";

const streetReference = {
  visualIntent: "street portrait", composition: { framing: "environmental", cameraAngle: "low angle", cameraDistance: "wide", subjectPlacement: "left" },
  lighting: { character: "natural", direction: "side", flashBehavior: null, ambientExposure: "balanced", contrast: "medium" },
  environment: { setting: "urban street", architecturalCharacter: null, surfaceCharacter: null }, color: { palette: "neutral", grading: "natural", saturation: "medium" },
  texture: { grain: "subtle", sharpness: "natural", retouching: "low" }, depthOfField: "deep", poseLanguage: "walking profile", realismCharacter: "editorial",
  shotProfile: { framing: "environmental", cameraAngle: "low_angle", cameraDistance: "wide", subjectPlacement: "rule_of_thirds_left", productScale: "contextual", interaction: "worn", humanPose: "walking profile", handDirection: "none", lighting: "editorial_natural", background: "street", environment: "urban street", surfaces: "sidewalk", props: null, depthOfField: "deep", negativeSpace: "right", realism: "editorial", compositionNotes: "street layout", nonTransferableIdentityFeatures: ["reference garment"] },
} satisfies ReferenceStyleBrief;

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

test("strong Bag Studio preset beats generic bag heuristics while explicit carry can refine it", () => {
  const bag = profile("bags", "tote", ["hand", "torso"]);
  const studio = resolveSceneSuitability({ productProfile: bag, preset: { id: "bags-minimal-studio" }, strategy: "bags_on_model", vertical: "bags", userPrompt: "", presetAuthority: "strong" });
  assert.equal(studio?.selectedSceneFamily, "bags_studio");
  const carry = resolveSceneSuitability({ productProfile: bag, preset: { id: "bags-minimal-studio" }, strategy: "bags_on_model", vertical: "bags", userPrompt: "woman carrying the bag on shoulder", presetAuthority: "strong" });
  assert.equal(carry?.selectedSceneFamily, "bags_shoulder_carry");
});

test("apparel street family constraints prevent studio fallback and constrain allowed scene types", () => {
  const result = resolveSceneSuitability({
    productProfile: profile("apparel"), strategy: "fashion_on_model", vertical: "apparel", userPrompt: "",
    preset: { id: "apparel-street", allowedSceneTypes: ["urban_street"], disallowedSceneTypes: ["controlled_product_studio"] }, presetAuthority: "strong",
  });
  assert.equal(result?.selectedSceneFamily, "apparel_street");
  assert.ok(result?.suitableSceneFamilies.includes("apparel_street"));
  assert.ok(!result?.suitableSceneFamilies.includes("apparel_studio"));
});

test("explicit user scene intent and a reference authority can override the selected family", () => {
  const userOverride = resolveSceneSuitability({ productProfile: profile("apparel"), strategy: "fashion_on_model", vertical: "apparel", userPrompt: "studio product shot", preset: { id: "apparel-street", allowedSceneTypes: ["urban_street"] }, presetAuthority: "supporting" });
  assert.equal(userOverride?.selectedSceneFamily, "apparel_studio");
  const referenceOverride = resolveSceneSuitability({ productProfile: profile("apparel"), strategy: "fashion_on_model", vertical: "apparel", userPrompt: "", preset: { id: "apparel-studio", allowedSceneTypes: ["controlled_product_studio"], disallowedSceneTypes: ["urban_street"] }, presetAuthority: "supporting", reference: streetReference, referenceAuthority: true });
  assert.equal(referenceOverride?.selectedSceneFamily, "apparel_street");
  assert.equal(referenceOverride?.source, "reference_authority");
  const explicitOverride = resolveSceneSuitability({ productProfile: profile("apparel"), strategy: "fashion_on_model", vertical: "apparel", userPrompt: "studio product shot", preset: { id: "apparel-street" }, presetAuthority: "supporting", reference: streetReference, referenceAuthority: true });
  assert.equal(explicitOverride?.selectedSceneFamily, "apparel_studio");
  assert.equal(explicitOverride?.source, "explicit_user_intent");
});

test("binding product-only Apparel Studio suppresses street references and scene requests", () => {
  const result = resolveSceneSuitability({
    productProfile: profile("apparel"), strategy: "rigid_product", vertical: "apparel", userPrompt: "night street editorial",
    preset: { id: "apparel-studio", allowedSceneTypes: ["controlled_product_studio"] },
    reference: streetReference, referenceAuthority: true, strictProductOnlyStudio: true,
  });
  assert.equal(result?.selectedSceneFamily, "apparel_studio");
  assert.deepEqual(result?.suitableSceneFamilies, ["apparel_studio"]);
  assert.equal(result?.source, "trusted_preset");
});
