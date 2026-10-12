import assert from "node:assert/strict";
import test from "node:test";

import { mapProductAnalysisModelOutput, productAnalysisModelOutputSchema } from "../src/lib/product-understanding/product-analysis-model-output";
import { compileProductProfilePrompt } from "../src/lib/product-understanding/compile-product-profile-prompt";
import { buildProductIdentityManifest } from "../src/lib/product-identity/build-product-identity-manifest";
import { compileProductIdentityLock } from "../src/lib/product-identity/compile-product-identity-lock";
import { resolveGenerationStrategy, generationStrategies } from "../src/lib/generation/strategy/generation-strategy";
import { resolveSceneSuitability } from "../src/lib/scene-suitability/resolve-scene-suitability";
import { resolveComposition } from "../src/lib/composition-intelligence/resolve-composition";
import { resolveHumanRealismPolicy } from "../src/lib/human-realism/human-realism-policy";
import { compileHumanRealismPrompt } from "../src/lib/human-realism/compile-human-realism-prompt";
import { compileOutputFormatGuidance, buildImageGenerationPromptWithPolicy } from "../src/lib/generation/prompts/build-image-generation-prompt";
import { orderGenerationImages, buildReferenceReplacementPrompt } from "../src/lib/generation/image-roles";
import { resolveGenerationExecutionPolicy } from "../src/lib/generation/execution-policy/resolve-generation-execution-policy";
import { getRecommendedPresets } from "../src/lib/creative-presets/creative-presets";
import { mapStructuredValidationOutput, resolveQualityGate } from "../src/lib/fidelity-validation/resolve-quality-gate";
import { resolveRepairPlan } from "../src/lib/auto-repair/resolve-repair-plan";
import { supportedVerticals } from "../src/lib/verticals/supported-verticals";
import type { ProductProfile } from "../src/lib/product-understanding/product-profile";

const details = {
  bagType: "structured handbag", silhouette: "rounded structured shoulder bag", proportions: "wide body, short height", bodyStructure: "semi-rigid",
  handleCount: 2, handleGeometry: "two short arched top handles", handleAttachmentPoints: ["front upper corners"], strapCount: 1,
  strapPlacement: ["side rings"], strapWidth: "narrow", strapLengthClass: "shoulder", closureType: "zipper",
  flapOrOpeningShape: "zip top", zipperLayout: ["top opening"], pocketLayout: ["one rear slip pocket"], panelConstruction: ["front seam panel"],
  stitchingPattern: "edge stitch", pipingOrEdgeTreatment: "piped edges", hardwareLayout: ["two side rings", "front clasp"], hardwareColor: "silver",
  logoOrMonogramPlacement: [{ location: "front center", description: "small embossed logo" }], material: "grained leather", materialTexture: "pebbled",
  colorBlocking: ["burgundy body"], patternOrPrint: null, baseShape: "flat oval base", baseFeetHardware: "four silver feet", chainStrap: false,
  decorativeCharms: [], asymmetricDetails: [],
};

function profile(overrides: Partial<ProductProfile> = {}): ProductProfile {
  return {
    productId: "bag-source", schemaVersion: 2, analysisVersion: "test", vertical: "bags", subcategory: "handbag", wearability: "context_dependent", rigidity: "semi_rigid",
    materials: ["grained leather"], dominantColors: ["burgundy"], productShape: "rounded structured shoulder bag",
    identityCriticalAttributes: [{ attribute: "two handles and a side strap", rationale: "defines the SKU", regions: [] }],
    visibleBranding: { hasLogo: true, hasReadableText: false, hasArtwork: false, logoRegions: details.logoOrMonogramPlacement, textRegions: [], artworkRegions: [] },
    interactionTargets: ["hand", "torso"], allowedTransformations: ["perspective_change", "lighting_or_reflection_change"], forbiddenTransformations: ["recolor", "logo_movement", "geometry_redesign"],
    sceneAffinities: { recommendedSceneTags: ["studio", "street", "crossbody"], discouragedSceneTags: ["occluded", "cropped"] }, confidence: { overall: 0.98 },
    source: { model: "fixture", analysisVersion: "test", analyzedAt: "2026-10-01" }, verticalAttributes: { vertical: "bags", details }, ...overrides,
  };
}

function bagOutput(bagType: string) {
  return {
    status: "supported", inferredCategory: "bag", vertical: "bags", subcategory: bagType, wearability: "context_dependent", rigidity: "semi_rigid",
    materials: ["leather"], dominantColors: ["burgundy"], productShape: "structured handbag",
    identityCriticalAttributes: [], visibleBranding: { hasLogo: true, hasReadableText: false, hasArtwork: false, logoRegions: [], textRegions: [], artworkRegions: [] },
    interactionTargets: ["hand", "torso"], allowedTransformations: ["perspective_change"], forbiddenTransformations: ["recolor", "geometry_redesign"],
    recommendedSceneTags: ["studio"], discouragedSceneTags: ["occluded"], confidence: { overall: .96 },
    apparel: null, jewelry: null, watch: null, cosmetics: null, footwear: null, bags: { ...details, bagType },
  };
}

test("handbag, tote, shoulder bag, and backpack are classified as bags", () => {
  for (const subtype of ["handbag", "tote bag", "shoulder bag", "backpack"]) {
    const result = mapProductAnalysisModelOutput(bagOutput(subtype), { assetId: "bag-source", model: "fixture", analyzedAt: "2026-10-01" });
    assert.equal(result && "vertical" in result ? result.vertical : null, "bags", subtype);
    assert.equal(result && "subcategory" in result ? result.subcategory : null, subtype);
  }
  assert.ok(productAnalysisModelOutputSchema.properties.vertical.enum.includes("bags"));
});

test("bag identity manifest and Product Identity Lock preserve construction and branding", () => {
  const source = profile();
  const manifest = buildProductIdentityManifest(source);
  const prompt = compileProductIdentityLock(manifest);
  const profilePrompt = compileProductProfilePrompt(source);
  assert.equal(manifest.vertical, "bags");
  assert.match(manifest.geometryAnchors.join(" "), /handle count: 2.*strap count: 1.*closure geometry: zipper.*pocket: one rear slip pocket/i);
  assert.match(prompt, /BAG PRODUCT IDENTITY LOCK.*Never add or remove a handle, strap, zipper, pocket/i);
  assert.match(profilePrompt.identity.join(" "), /Preserve handle count exactly: 2.*Preserve strap count exactly: 1.*Preserve closure type/i);
  assert.match(profilePrompt.identity.join(" "), /logo\/monogram design/i);
});

test("bag carry strategy, suitable scenes, composition, and human contact are resolved", () => {
  const source = profile();
  const route = resolveGenerationStrategy({ productProfile: source, userPrompt: "Natural crossbody carry on a model", referenceInteraction: "none" });
  assert.equal(route.strategy, "bags_on_model");
  assert.equal(route.effectivePreservationMode, "reference_edit");
  const scene = resolveSceneSuitability({ productProfile: source, strategy: route.strategy, userPrompt: "crossbody street editorial" });
  assert.equal(scene?.selectedSceneFamily, "bags_crossbody");
  assert.match(resolveComposition({ productProfile: source, sceneFamily: scene?.selectedSceneFamily, userPrompt: "crossbody" })?.negativeCompositionRules.join(" ") ?? "", /strap path/i);
  const human = resolveHumanRealismPolicy({ strategy: "bags_on_model", vertical: "bags", handsVisible: true });
  assert.ok(human.applied && human.focusAreas.includes("hands") && human.focusAreas.includes("contact"));
  assert.match(compileHumanRealismPrompt(human, "bags"), /Fingers naturally grip handles/i);
});

test("bag references cannot override source product and preserve primary reference hierarchy", () => {
  const assets = ["source", "primary", "supporting"].map((id) => ({ id, bucketId: "assets", objectPath: `${id}.png`, data: Buffer.from(id), mimeType: "image/png" as const }));
  const images = orderGenerationImages(assets[0]!, assets.slice(1));
  assert.deepEqual(images.map(({ role }) => role), ["product_identity_source", "scene_reference", "style_reference"]);
  const prompt = buildImageGenerationPromptWithPolicy("Quiet studio bag campaign", "reference_edit", { productProfile: profile(), strategy: "rigid_product", generationImages: images, aspectRatio: "3:4" });
  assert.match(prompt.prompt, /BAG REFERENCE SUPPRESSION.*Do not copy the reference bag's silhouette/i);
  assert.match(prompt.prompt, /first scene\/style reference is PRIMARY.*Later references are SUPPORTING/i);
  assert.match(buildReferenceReplacementPrompt("soft daylight"), /bag handles, straps, closure/i);
});

test("bag aspect ratios protect product visibility and proportions", () => {
  for (const ratio of ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"] as const) {
    assert.match(compileOutputFormatGuidance(ratio, "bags"), /bag|handles|product|composition/i);
    assert.match(compileOutputFormatGuidance(ratio, "bags"), /Never distort bag proportions/i);
  }
  assert.match(compileOutputFormatGuidance("9:16", "bags"), /full-body, shoulder, or crossbody/i);
  assert.match(compileOutputFormatGuidance("21:9", "bags"), /edge cropping/i);
});

test("riskier bags run at xhigh and recommendation starts with bag-suitable existing presets", () => {
  const source = profile();
  const execution = resolveGenerationExecutionPolicy({ productProfile: source, hasReference: false, referenceReplacement: false, exactProduct: false, artworkLocalized: false, presetConfidence: "high", hasCustomNote: false, ambiguousNote: false, strategy: "bags_on_model" });
  assert.equal(execution.quality, "xhigh");
  assert.deepEqual(getRecommendedPresets({ vertical: "bags" }).slice(0, 3).map(({ id }) => id), ["bags-on-model", "bags-studio", "bags-lifestyle"]);
});

test("bag identity failures fail, natural deformation warns, and targeted repair preserves scene", () => {
  const [substitution] = mapStructuredValidationOutput({ findings: [{ code: "BAG_PRODUCT_SUBSTITUTION", category: "realism", severity: "minor", confidence: .96, finding: "different bag", expected: "source handbag" }] });
  assert.equal(substitution?.category, "product_identity");
  assert.equal(resolveQualityGate([substitution!]).status, "fail");
  const [deformation] = mapStructuredValidationOutput({ findings: [{ code: "BAG_NATURAL_DEFORMATION", category: "geometry", severity: "critical", confidence: .94, finding: "small leather fold", expected: "natural surface" }] });
  assert.equal(deformation?.severity, "minor");
  assert.equal(resolveQualityGate([deformation!]).status, "pass_with_warnings");
  const [contact] = mapStructuredValidationOutput({ findings: [{ code: "BAG_CONTACT_IMPLAUSIBLE", category: "human_realism", severity: "critical", confidence: .96, finding: "floating strap", expected: "natural contact" }] });
  const plan = resolveRepairPlan({ status: "fail", checks: [], issues: [contact!], severity: "critical", retryRecommended: true, commerciallyUsable: false, summary: "failed", version: "test" });
  assert.equal(plan.shouldRetry, true);
  assert.equal(plan.repairInstructions.length, 1);
  assert.match(plan.repairInstructions[0]!, /preserving bag identity and scene/i);
  assert.ok(!generationStrategies.some((strategy) => strategy.includes("stage")));
});

test("the existing five public verticals remain supported", () => {
  for (const vertical of ["apparel", "jewelry", "watches", "cosmetics", "footwear"] as const) assert.ok(supportedVerticals.includes(vertical));
  assert.equal(supportedVerticals.length, 6);
});
