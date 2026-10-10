import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  buildCreativePresetDirection,
  canCreateImageWithPreset,
  createCreativePresetMetadata,
  renderPresetCreativeDirection,
} from "../src/lib/creative-presets/creative-preset-context";
import {
  creativePresetCategories,
  creativePresets,
  getRecommendedPresets,
  getCreativePreset,
  getHistoricalCreativePreset,
  getHistoricalPresetMetadata,
  presetFamilies,
  resolvePresetVariant,
  resolvePresetVariantWithHistory,
  buildPresetVariantDirection,
  getPresetFamily,
  getPresetVariationMetadata,
  isProductOnlyPresentationMode,
  isCompatiblePresetSystemVersion,
  getPresetPresentationMode,
  getPresetPresentationModes,
  getPresetVariantsForPresentationMode,
  getRecommendedFamilyPresets,
  historicalUnsupportedPresetIds,
} from "../src/lib/creative-presets/creative-presets";
import { creativeBriefFields, type CreativeBrief } from "../src/lib/generation/prompts/creative-brief";
import { getVerticalQualityProfile } from "../src/lib/generation/quality/vertical-quality-profiles";
import { buildImageGenerationPromptWithPolicy } from "../src/lib/generation/prompts/build-image-generation-prompt";
import { resolveGenerationStrategy } from "../src/lib/generation/strategy/generation-strategy";
import {
  enhanceCreativeDirectionWithClient,
  type PromptEnhancementClient,
} from "../src/lib/generation/prompts/prompt-enhancement-core";
import { supportedVerticals } from "../src/lib/verticals/supported-verticals";

const validBrief: CreativeBrief = {
  subject: "The supplied product remains the single premium campaign subject.",
  pose: "A natural product-led pose with clear, stable presentation.",
  environment: "A restrained commercial environment with real material context.",
  composition: "A clear and balanced commercial hero composition.",
  camera: "Commercial photography with an accurate natural perspective.",
  lighting: "Controlled premium lighting with physically plausible shadows.",
  mood: "Modern, refined, and commercially focused.",
  realism: "Photorealistic material detail and realistic surface interaction.",
  productTreatment: "Keep the supplied product exact and visibly central.",
  negativeConstraints: "No product redesigns, added logos, or duplicate products.",
  capture: null,
};

test("preset recommendations show only family cards and stay deterministic", () => {
  const recommendations = getRecommendedPresets({ vertical: null });

  assert.equal(recommendations.length, 6);
  assert.equal(new Set(recommendations.map((preset) => preset.id)).size, 6);
  assert.deepEqual(recommendations.map((preset) => preset.id), getRecommendedPresets({ vertical: null }).map((preset) => preset.id));
  assert.ok(recommendations.every((preset) => getPresetFamily(preset.id)));
});

test("known vertical recommendations do not fill with unrelated families", () => {
  for (const vertical of supportedVerticals) {
    const recommendations = getRecommendedFamilyPresets({ vertical });
    assert.ok(recommendations.length === (vertical === "cosmetics" ? 2 : 3));
    assert.ok(recommendations.every((preset) => preset.vertical === vertical));
  }
});

test("selected non-recommended families stay visible", () => {
  const selectedId = getRecommendedFamilyPresets({ vertical: "cosmetics" })[1]?.id;
  assert.ok(selectedId);
  const collapsed = getRecommendedPresets({ vertical: "apparel", selectedPresetId: selectedId });

  assert.equal(collapsed.length, 4);
  assert.ok(collapsed.some((preset) => preset.id === selectedId));
  assert.equal(getRecommendedFamilyPresets({ vertical: "apparel" }).length, 3);
});

class CapturingEnhancementClient implements PromptEnhancementClient {
  input: Parameters<PromptEnhancementClient["createCreativeBrief"]>[0] | null = null;

  async createCreativeBrief(input: Parameters<PromptEnhancementClient["createCreativeBrief"]>[0]) {
    this.input = input;
    return validBrief;
  }
}

function requiredPreset(id: string) {
  const preset = getCreativePreset(id);
  assert.ok(preset, `Expected preset ${id} to exist.`);
  return preset;
}

test("active registry contains exactly three complete presets for each supported vertical", () => {
  assert.equal(creativePresets.length, 18);
  assert.deepEqual(creativePresetCategories, supportedVerticals);
  assert.equal(new Set(creativePresets.map((preset) => preset.id)).size, 18);

  for (const vertical of supportedVerticals) {
    const presets = creativePresets.filter((preset) => preset.vertical === vertical);
    assert.equal(presets.length, 3, `${vertical} must expose exactly three active presets`);

    for (const preset of presets) {
      assert.equal(preset.category, vertical);
      assert.equal(preset.useCase, vertical);
      assert.equal(getVerticalQualityProfile(preset.vertical).vertical, vertical);
      assert.ok(preset.shortDescription.length >= 35, `${preset.id} needs a clear card description`);
      assert.ok(preset.generationStrategyHint.length > 0);
      assert.ok(existsSync(resolve(process.cwd(), "public", preset.thumbnail.slice(1))), `${preset.id} cover is missing`);

      for (const field of creativeBriefFields) {
        assert.ok(preset.creativeDirection[field].trim().length >= 25, `${preset.id}.${field} is too vague`);
      }
    }
  }
});

test("active preset cards map one-to-one to distinct, sector-correct covers", () => {
  assert.equal(new Set(creativePresets.map((preset) => preset.thumbnail)).size, 17);
  assert.deepEqual(
    creativePresets.map((preset) => preset.thumbnail),
    [
      "/images/presets/apparel-street.webp",
      "/images/presets/apparel-scenic.webp",
      "/images/presets/apparel-studio.webp",
      "/images/presets/jewelry-on-model.webp",
      "/images/presets/jewelry-studio.webp",
      "/images/presets/jewelry-lifestyle-still-life.webp",
      "/images/presets/watches-on-wrist.webp",
      "/images/presets/watches-product-composition.webp",
      "/images/presets/watches-editorial-studio.webp",
      "/images/presets/footwear-scenic-lifestyle.webp",
      "/images/presets/footwear-studio.webp",
      "/images/presets/footwear-street.webp",
      "/images/presets/cosmetics-studio.webp",
      "/images/presets/cosmetics-scenic-lifestyle.webp",
      "/images/presets/cosmetics-scenic-lifestyle.webp",
      "/images/presets/bags-lifestyle-setting.webp",
      "/images/presets/bags-studio.webp",
      "/images/presets/bags-on-model.webp",
    ],
  );
});

test("public preset families expose explicit scene contracts and varied internal variants", () => {
  const expected: Record<(typeof supportedVerticals)[number], number> = {
    apparel: 3, watches: 3, jewelry: 3, footwear: 3, cosmetics: 2, bags: 3,
  };
  assert.equal(presetFamilies.length, 17);
  for (const vertical of supportedVerticals) {
    const families = presetFamilies.filter((family) => family.vertical === vertical);
    assert.equal(families.length, expected[vertical]);
    for (const family of families) {
      assert.ok(family.variants.length >= 8);
      assert.ok(family.variants.every((variant) => variant.familyId === family.id));
      assert.ok(family.variants.every((variant) => variant.environmentDirection && variant.lightingDirection && variant.compositionDirection));
      assert.ok(family.variants.every((variant) => variant.environmentSubtype && variant.cameraDistance && variant.cameraAngle && variant.framing && variant.composition && variant.subjectPlacement && variant.interaction && variant.surface && variant.architecture && variant.propLanguage && variant.mood && variant.captureProfile));
      assert.ok(family.allowedSceneTypes.length && family.hardRules.length && family.softRules.length);
      assert.ok(family.environmentVariants.length >= 8);
      assert.equal(new Set(family.variants.map(({ id }) => id)).size, family.variants.length);
    }
    const studio = families.find(({ id }) => id.includes("studio"));
    if (studio && !["fashion_on_model", "jewelry_on_model", "watch_on_wrist", "footwear_on_model", "bags_on_model"].includes(studio.generationStrategyHint)) { assert.ok(studio.disallowedSceneTypes.includes("people")); assert.ok(studio.disallowedSceneTypes.includes("street")); }
  }
});

test("environment-heavy families retain hidden variation while every variant has one explicit mode contract", () => {
  const expanded = new Set(["apparel-street", "apparel-studio", "apparel-scenic", "watches-on-wrist", "jewelry-on-model", "jewelry-lifestyle", "footwear-street", "footwear-scenic", "cosmetics-scenic", "bags-on-model", "bags-lifestyle"]);
  for (const family of presetFamilies) {
    assert.ok(family.variants.length >= 8, family.id);
    if (expanded.has(family.id)) assert.ok(family.variants.length >= 10 && family.variants.length <= 16, family.id);
    for (const variant of family.variants) {
      const mode = getPresetPresentationMode(family.id, variant.presentationMode);
      assert.ok(mode?.contract.variantIds.includes(variant.id), `${family.id}/${variant.id}`);
    }
  }
});

test("studio, aesthetic environment, on-model, and street contracts stay distinct", () => {
  const studio = getPresetFamily("bags-studio")!;
  const aesthetic = getPresetFamily("bags-lifestyle")!;
  const model = getPresetFamily("bags-on-model")!;
  const street = getPresetFamily("apparel-street")!;
  assert.ok(studio.allowedSceneTypes.includes("controlled_product_studio"));
  assert.ok(studio.disallowedSceneTypes.includes("cafe"));
  assert.ok(aesthetic.allowedSceneTypes.includes("human_free_editorial_environment"));
  assert.ok(aesthetic.disallowedSceneTypes.includes("people"));
  assert.ok(model.allowedSceneTypes.includes("human_interaction"));
  assert.ok(street.allowedSceneTypes.includes("urban_street"));
});

test("preset family prompt survives reference inputs and retains family-specific scene grammar", () => {
  const studio = getPresetFamily("bags-studio")!;
  const prompt = buildImageGenerationPromptWithPolicy("Product studio image.", "reference_edit", {
    strategy: "rigid_product", useCase: "bags", presetFamilyId: studio.id,
    presetRules: { allowedSceneTypes: studio.allowedSceneTypes, disallowedSceneTypes: studio.disallowedSceneTypes, hardRules: studio.hardRules, softRules: studio.softRules, variantId: studio.variants[0]!.id },
    generationImages: [{ role: "product_identity_source" }, { role: "scene_reference" }] as never,
  }).prompt;
  assert.match(prompt, /PRESET FAMILY INTENT \(bags-studio\)/);
  assert.match(prompt, /no people, no models, no hands, no body contact/i);
  assert.match(prompt, /keep this family as the dominant scene identity even when references are supplied/i);
});

test("variant selection is deterministic, valid, and avoids the most recent alternative", () => {
  const family = getPresetFamily("apparel-street");
  assert.ok(family);
  const first = resolvePresetVariant({ family, generationSeed: "generation-a" });
  const next = resolvePresetVariant({ family, generationSeed: "generation-b", previousVariantId: first.id });
  assert.ok(family.variants.some((variant) => variant.id === next.id));
  assert.notEqual(next.id, first.id);
  assert.equal(resolvePresetVariant({ family, generationSeed: "generation-a" }).id, first.id);
  const historySafe = resolvePresetVariantWithHistory(family, "generation-a", first.id);
  assert.notEqual(historySafe.id, first.id);
});

test("Street recent-history selection avoids rainy-night dimensions and remains deterministic", () => {
  const family = getPresetFamily("apparel-street")!;
  const rainy = family.variants.find(({ id }) => id.endsWith("rainy-city"))!;
  const history = [{ variantId: rainy.id, environment: rainy.environment, timeOfDay: rainy.timeOfDay, weather: rainy.weather, lighting: rainy.lighting, pose: rainy.pose, framing: rainy.framing, cameraAngle: rainy.cameraAngle, captureProfile: rainy.captureProfile }];
  const next = resolvePresetVariantWithHistory(family, "run-after-rain", rainy.id, history);
  assert.equal(next.familyId, "apparel-street");
  assert.notEqual(next.id, rainy.id);
  for (const key of ["environment", "weather", "lighting"] as const) assert.notEqual(next[key], rainy[key], `${key} should vary after rainy night`);
  assert.equal(resolvePresetVariantWithHistory(family, "run-after-rain", rainy.id, history).id, next.id);
});

test("Street variants define diverse camera, pose, scene, and capture metadata", () => {
  const family = getPresetFamily("apparel-street")!;
  assert.equal(family.variants.length, 13);
  assert.ok(new Set(family.variants.map(({ captureProfile }) => captureProfile)).size >= 2);
  assert.ok(new Set(family.variants.map(({ pose }) => pose)).size >= 8);
  assert.ok(new Set(family.variants.map(({ framing }) => framing)).size >= 3);
  assert.ok(new Set(family.variants.map(({ environment }) => environment)).size >= 10);
  for (const variant of family.variants) assert.equal(variant.familyId, "apparel-street");
  const preset = requiredPreset("apparel-street-style");
  const variant = family.variants.find(({ id }) => id.endsWith("glass-facade"))!;
  const directed = buildPresetVariantDirection(preset, variant);
  assert.equal(directed.creativeDirection.capture?.profile, variant.captureProfile);
  assert.equal(getPresetVariationMetadata(variant).captureProfile, variant.captureProfile);
});

test("scene locked references can bypass recent-history diversity and user direction remains explicit", () => {
  const family = getPresetFamily("apparel-street")!;
  const previous = family.variants[0]!;
  const sameSceneHistory = [{ variantId: previous.id, environment: previous.environment, timeOfDay: previous.timeOfDay, weather: previous.weather, lighting: previous.lighting, pose: previous.pose, framing: previous.framing, cameraAngle: previous.cameraAngle, captureProfile: previous.captureProfile }];
  const diverse = resolvePresetVariantWithHistory(family, "reference-scene-seed", previous.id, sameSceneHistory);
  const referenceLocked = resolvePresetVariantWithHistory(family, "reference-scene-seed", previous.id, []);
  assert.notEqual(diverse.id, previous.id);
  assert.equal(referenceLocked.id, resolvePresetVariantWithHistory(family, "reference-scene-seed", previous.id).id);
  const customized = buildCreativePresetDirection("Keep the same model and scene.", buildPresetVariantDirection(requiredPreset("apparel-street-style"), referenceLocked));
  assert.match(customized, /Keep the same model and scene/i);
  assert.match(customized, /apparel-street/);
});

test("Bag Studio variants, routing, prompt suppression, and metadata stay family compliant", () => {
  const family = getPresetFamily("bags-studio");
  assert.ok(family);
  for (const seed of ["bag-a", "bag-b", "bag-c", "bag-d"]) {
    const variant = resolvePresetVariant({ family, generationSeed: seed });
    assert.equal(variant.familyId, "bags-studio");
    assert.ok(family.variants.includes(variant));
  }
  const studioPreset = buildPresetVariantDirection(requiredPreset("bags-studio"), family.variants[0]!);
  assert.doesNotMatch(studioPreset.creativeDirection.pose, /crossbody|shoulder fit|hand-held/i);
  assert.match(studioPreset.creativeDirection.environment, /studio/i);
  const metadata = createCreativePresetMetadata(studioPreset, family.variants[0]!.id);
  assert.ok(metadata);
  assert.equal(metadata.version, "preset-system-v5");
  assert.equal(metadata.familyId, "bags-studio");
  assert.equal(metadata.variantId, family.variants[0]!.id);
});

test("bag family routing keeps Studio and Lifestyle product-only while On Model owns carry", () => {
  const profile = { vertical: "bags", wearability: "wearable", interactionTargets: ["hand", "torso"] } as never;
  const studio = resolveGenerationStrategy({ preset: requiredPreset("bags-studio"), presetFamilyId: "bags-studio", productProfile: profile, userPrompt: "" });
  const lifestyle = resolveGenerationStrategy({ preset: requiredPreset("bags-lifestyle"), presetFamilyId: "bags-lifestyle", productProfile: profile, userPrompt: "" });
  const onModel = resolveGenerationStrategy({ preset: requiredPreset("bags-on-model"), presetFamilyId: "bags-on-model", productProfile: profile, userPrompt: "" });
  const requestedCarry = resolveGenerationStrategy({ preset: requiredPreset("bags-studio"), presetFamilyId: "bags-studio", productProfile: profile, userPrompt: "Woman carrying the tote on shoulder" });
  assert.equal(studio.strategy, "rigid_product");
  assert.equal(lifestyle.strategy, "rigid_product");
  assert.equal(onModel.strategy, "bags_on_model");
  assert.notEqual(studio.strategy, "bags_on_model");
  assert.notEqual(lifestyle.strategy, "bags_on_model");
  assert.notEqual(lifestyle.strategy, "bags_handheld");
  assert.equal(requestedCarry.strategy, "bags_on_model");
  assert.match(buildPresetVariantDirection(requiredPreset("bags-on-model"), getPresetFamily("bags-on-model")!.variants[0]!).creativeDirection.pose, /crossbody only with its source crossbody strap/i);
});

test("selected bag presentation remains authoritative over conflicting reference interaction", () => {
  const result = resolveGenerationStrategy({
    preset: requiredPreset("bags-studio"), presetFamilyId: "bags-studio", hasReference: true,
    productProfile: { vertical: "bags", wearability: "wearable", interactionTargets: ["hand", "torso"] } as never,
    referenceInteraction: "worn", userPrompt: "",
  });
  assert.equal(result.strategy, "rigid_product");
});

test("Bag Studio and Aesthetic Environment prompts suppress humans unless strategy is explicitly overridden", () => {
  const studioFamily = { selectedSceneFamily: "bags_studio", suitableSceneFamilies: [], avoidedSceneFamilies: [], reason: "preset", confidence: "high", source: "trusted_preset" } as never;
  const noReference = buildImageGenerationPromptWithPolicy("A premium tabletop studio bag photograph.", "pixel_lock", {
    strategy: "rigid_product", useCase: "bags", productProfile: null, sceneSuitability: studioFamily,
    presetFamilyId: "bags-studio", generationImages: [{ role: "product_identity_source" } as never],
  }).prompt;
  assert.match(noReference, /no people, no models, no hands, no body contact, no worn bag, no carry interaction/i);
  const withReference = buildImageGenerationPromptWithPolicy("A premium bag photograph.", "reference_edit", {
    strategy: "rigid_product", useCase: "bags", productProfile: null, sceneSuitability: studioFamily,
    presetFamilyId: "bags-studio", generationImages: [{ role: "product_identity_source" }, { role: "scene_reference" }] as never,
  }).prompt;
  assert.match(withReference, /BAG STUDIO PRESET COMPLIANCE/);
  const lifestyle = buildImageGenerationPromptWithPolicy("A premium bag in a beautiful environment.", "pixel_lock", {
    strategy: "rigid_product", useCase: "bags", productProfile: null,
    presetFamilyId: "bags-lifestyle", generationImages: [{ role: "product_identity_source" } as never],
  }).prompt;
  assert.match(lifestyle, /product-only aesthetic environment/i);
  assert.match(lifestyle, /no people, no models, no hands, no worn bag/i);
  const explicitHumanOverride = buildImageGenerationPromptWithPolicy("A woman carrying the bag.", "pixel_lock", {
    strategy: "bags_on_model", useCase: "bags", productProfile: null,
    presetFamilyId: "bags-lifestyle", generationImages: [{ role: "product_identity_source" } as never],
  }).prompt;
  assert.doesNotMatch(explicitHumanOverride, /BAG AESTHETIC ENVIRONMENT PRESET COMPLIANCE/);
});

test("bag families expose distinct compliant internal variants", () => {
  const onModel = getPresetFamily("bags-on-model")!;
  const studio = getPresetFamily("bags-studio")!;
  const lifestyle = getPresetFamily("bags-lifestyle")!;
  assert.ok(new Set(onModel.variants.map(({ environmentDirection }) => environmentDirection)).size >= 6);
  assert.ok(onModel.variants.every(({ environmentDirection }) => /woman|model/i.test(environmentDirection)));
  assert.ok(studio.variants.every(({ environmentDirection }) => /studio/i.test(environmentDirection)));
  assert.ok(studio.variants.every(({ environmentDirection }) => /no people|no model|no human|product-only|unsupported by people/i.test(environmentDirection)));
  assert.ok(new Set(lifestyle.variants.map(({ environmentDirection }) => environmentDirection)).size >= 6);
  assert.ok(lifestyle.variants.every(({ environmentDirection }) => /product-only/i.test(environmentDirection)));
  assert.ok(lifestyle.variants.every(({ environmentDirection }) => /no people|no person|no human|without people/i.test(environmentDirection)));
});

test("family contract and resolved structured variant metadata persist with the v5 version", () => {
  const preset = requiredPreset("bags-on-model");
  const variant = getPresetFamily(preset.id)?.variants[0];
  assert.ok(variant);
  const metadata = createCreativePresetMetadata(preset, variant.id);
  assert.ok(metadata);
  assert.equal(metadata.version, "preset-system-v5");
  assert.equal(metadata.familyId, "bags-on-model");
  assert.equal(metadata.variantId, variant.id);
  assert.deepEqual(metadata.allowedSceneTypes, getPresetFamily("bags-on-model")!.allowedSceneTypes);
});

test("Preset V5 adds structured presentation metadata to every internal variant", () => {
  assert.equal(isCompatiblePresetSystemVersion("preset-system-v4"), true);
  assert.equal(isCompatiblePresetSystemVersion("preset-system-v5"), true);
  for (const family of presetFamilies) {
    for (const variant of family.variants) {
      const metadata = getPresetVariationMetadata(variant);
      for (const key of ["presentationMode", "productOrientation", "physicalSupport", "gravityBehavior", "humanPresence", "interactionMode"] as const) {
        assert.ok(metadata[key], `${family.id}/${variant.id} lacks ${key}`);
      }
    }
  }
});

test("presentation mode selector exposes only valid family-specific modes", () => {
  const studio = getPresetFamily("apparel-studio")!;
  const studioModes = getPresetPresentationModes(studio.id);
  assert.deepEqual(studioModes.map(({ id }) => id), ["model_studio", "ghost_mannequin", "floating", "hanger", "flat_lay", "folded", "sculptural_stage", "fabric_motion", "detail", "catalogue_product"]);
  assert.equal(getPresetPresentationModes("bags-studio").some(({ id }) => id === "shoulder_carry"), false);
  assert.equal(getPresetPresentationMode(studio.id, "floating")?.variantPresentationModes.includes("floating"), true);
  assert.equal(getPresetPresentationMode(studio.id, "not-a-mode"), null);
});

test("selected presentation mode binds variant resolution while null preserves automatic V5 behavior", () => {
  const studio = getPresetFamily("apparel-studio")!;
  const floating = getPresetVariantsForPresentationMode(studio, "floating");
  assert.equal(floating.length, 2);
  assert.ok(floating.every(({ presentationMode }) => presentationMode === "floating"));
  const first = resolvePresetVariantWithHistory({ ...studio, variants: floating }, "floating-first", null, []);
  const second = resolvePresetVariantWithHistory({ ...studio, variants: floating }, "floating-second", first.id, [getPresetVariationMetadata(first)]);
  assert.ok(floating.some(({ id }) => id === second.id));
  assert.notEqual(second.id, first.id);
  assert.equal(getPresetVariantsForPresentationMode(studio, null).length, studio.variants.length);
});

test("selected Ghost Mannequin and Floating remain product-only", () => {
  const studio = getPresetFamily("apparel-studio")!;
  const ghost = getPresetVariantsForPresentationMode(studio, "ghost_mannequin");
  const floating = getPresetVariantsForPresentationMode(studio, "floating");
  assert.ok(ghost.every(({ presentationMode, humanPresence }) => presentationMode === "ghost_mannequin" && humanPresence === "none"));
  assert.ok(floating.every(({ presentationMode, humanPresence }) => isProductOnlyPresentationMode(presentationMode) && humanPresence === "none"));
});

test("presentation selector UI, form persistence, and localized labels are present", () => {
  const root = process.cwd();
  const rail = readFileSync(resolve(root, "src/components/dashboard/creative-preset-rail.tsx"), "utf8");
  const composer = readFileSync(resolve(root, "src/components/dashboard/creative-composer.tsx"), "utf8");
  assert.match(rail, /preset-presentation-selector/);
  assert.match(rail, /getPresetPresentationModes/);
  assert.match(composer, /presentation_mode/);
  for (const locale of ["en", "tr"]) {
    const messages = JSON.parse(readFileSync(resolve(root, `src/messages/${locale}.json`), "utf8")) as { Dashboard: { presets: { presentationHeading: string; presentationModes: Record<string, string> } } };
    assert.ok(messages.Dashboard.presets.presentationHeading);
    for (const family of presetFamilies) {
      for (const mode of getPresetPresentationModes(family.id)) {
        assert.ok(messages.Dashboard.presets.presentationModes[mode.id], `${locale} is missing ${mode.id}`);
      }
    }
  }
});

test("Apparel Studio supports human and product-only presentation modes without phantom anatomy", () => {
  const family = getPresetFamily("apparel-studio")!;
  assert.equal(family.variants.length, 12);
  assert.ok(family.variants.some(({ humanPresence }) => humanPresence !== "none"));
  assert.ok(family.variants.some(({ humanPresence }) => humanPresence === "none"));
  const ghost = family.variants.find(({ presentationMode }) => presentationMode === "ghost_mannequin")!;
  const floating = family.variants.find(({ presentationMode }) => presentationMode === "floating")!;
  assert.equal(ghost.humanPresence, "none");
  assert.equal(floating.humanPresence, "none");
  assert.equal(isProductOnlyPresentationMode(ghost.presentationMode), true);
  const ghostDirection = buildPresetVariantDirection(requiredPreset("apparel-studio-style"), ghost);
  const floatingDirection = buildPresetVariantDirection(requiredPreset("apparel-studio-style"), floating);
  assert.match(ghostDirection.creativeDirection.negativeConstraints, /no person.*visible mannequin/i);
  assert.match(floatingDirection.creativeDirection.realism, /phantom hands/i);
});

test("Fabric Motion is a binding human-free studio presentation in prompts", () => {
  const family = getPresetFamily("apparel-studio")!;
  const fabricMotion = family.variants.find(({ presentationMode }) => presentationMode === "fabric_motion")!;
  const prompt = buildImageGenerationPromptWithPolicy("Night street fashion campaign", "reference_edit", {
    presetFamilyId: family.id,
    strictProductOnlyStudio: true,
    presetRules: { allowedSceneTypes: family.allowedSceneTypes, disallowedSceneTypes: family.disallowedSceneTypes, hardRules: family.hardRules, softRules: family.softRules, variantId: fabricMotion.id, presentationMode: fabricMotion.presentationMode, humanPresence: fabricMotion.humanPresence },
    referenceAuthority: true,
  }).prompt;
  assert.match(prompt, /BINDING PRODUCT-ONLY STUDIO PRESENTATION/i);
  assert.match(prompt, /Never show a street.*outdoor.*on-model interaction/i);
  assert.match(prompt, /Fabric Motion.*subtle suspended or wind-shaped fabric movement/i);
});

test("Apparel Studio presentation descriptions are distinct in Turkish and English", () => {
  const modes = getPresetPresentationModes("apparel-studio");
  for (const locale of ["tr", "en"] as const) {
    const messages = JSON.parse(readFileSync(resolve(process.cwd(), `src/messages/${locale}.json`), "utf8")) as { Dashboard: { presets: { presentationModeDescriptions: { "apparel-studio": Record<string, string> } } } };
    const descriptions = modes.map(({ id }) => messages.Dashboard.presets.presentationModeDescriptions["apparel-studio"][id]);
    assert.ok(descriptions.every(Boolean), `${locale} must describe every Apparel Studio mode`);
    assert.equal(new Set(descriptions).size, descriptions.length, `${locale} descriptions must be mode-specific`);
  }
});

test("presentationMode participates in recent-history diversity", () => {
  const family = getPresetFamily("apparel-studio")!;
  const ghost = family.variants.find(({ presentationMode }) => presentationMode === "ghost_mannequin")!;
  const next = resolvePresetVariantWithHistory(family, "after-ghost", ghost.id, [getPresetVariationMetadata(ghost)]);
  assert.notEqual(next.presentationMode, "ghost_mannequin");
});

test("footwear and bag visible presentation modes are explicit and non-empty", () => {
  for (const family of presetFamilies.filter(({ vertical }) => vertical === "footwear" || vertical === "bags")) {
    for (const mode of getPresetPresentationModes(family.id)) assert.ok(getPresetVariantsForPresentationMode(family, mode.id).length > 0, `${family.id}/${mode.id}`);
  }
});

test("selected product-only apparel presentation overrides conflicting prompt and reference intent", () => {
  const family = getPresetFamily("apparel-studio")!;
  const productOnly = family.variants.find(({ presentationMode }) => presentationMode === "ghost_mannequin")!;
  assert.equal(resolveGenerationStrategy({ preset: requiredPreset("apparel-studio-style"), presetFamilyId: family.id, presentationMode: productOnly.presentationMode, presentationHumanPresence: productOnly.humanPresence, userPrompt: "", explicitUserPrompt: "" }).strategy, "rigid_product");
  assert.equal(resolveGenerationStrategy({ preset: requiredPreset("apparel-studio-style"), presetFamilyId: family.id, presentationMode: productOnly.presentationMode, presentationHumanPresence: productOnly.humanPresence, userPrompt: "", explicitUserPrompt: "" }).effectivePreservationMode, "reference_edit");
  assert.equal(resolveGenerationStrategy({ preset: requiredPreset("apparel-studio-style"), presetFamilyId: family.id, presentationMode: productOnly.presentationMode, presentationHumanPresence: productOnly.humanPresence, userPrompt: "Show it worn by a model", explicitUserPrompt: "Show it worn by a model" }).strategy, "rigid_product");
  assert.equal(resolveGenerationStrategy({ preset: requiredPreset("apparel-studio-style"), presetFamilyId: family.id, presentationMode: productOnly.presentationMode, presentationHumanPresence: productOnly.humanPresence, hasReference: true, userPrompt: "", explicitUserPrompt: "" }).strategy, "rigid_product");
});

test("resolved creative direction adapts jewelry and bag placement to subtype without changing family", () => {
  const jewelry = buildPresetVariantDirection(requiredPreset("jewelry-on-model"), getPresetFamily("jewelry-on-model")!.variants[0]);
  const bags = buildPresetVariantDirection(requiredPreset("bags-on-model"), getPresetFamily("bags-on-model")!.variants[0]);
  assert.match(jewelry.creativeDirection.pose, /ring on finger, bracelet on wrist, necklace on neck\/collarbone/i);
  assert.match(bags.creativeDirection.pose, /crossbody only with its source crossbody strap/i);
  assert.equal(bags.id, "bags-on-model");
});

test("specialist preset briefs retain deterministic fidelity and framing directions", () => {
  const jewelryOnBody = renderPresetCreativeDirection(requiredPreset("jewelry-on-body"));
  const watchOnWrist = renderPresetCreativeDirection(requiredPreset("watch-on-wrist"));
  const footwearFocus = renderPresetCreativeDirection(requiredPreset("footwear-hero-focus"));
  const cosmeticsStudio = renderPresetCreativeDirection(requiredPreset("cosmetics-studio"));

  assert.match(jewelryOnBody, /fit the complete band precisely around a plausible finger/i);
  assert.match(jewelryOnBody, /stone count and placement/i);
  assert.match(watchOnWrist, /bracelet or strap naturally around the wrist/i);
  assert.match(watchOnWrist, /dial layout, bezel, crown side/i);
  assert.match(footwearFocus, /very close low-angle product-first frame/i);
  assert.match(footwearFocus, /outsole and midsole geometry/i);
  assert.match(cosmeticsStudio, /cap, pump, or dropper/i);
  assert.match(cosmeticsStudio, /glass, plastic, metal, liquid/i);
});

test("historical IDs resolve only through the compatibility registry", () => {
  assert.ok(historicalUnsupportedPresetIds.includes("urban-night"));
  assert.equal(getCreativePreset("urban-night"), null);

  const legacy = getHistoricalCreativePreset("urban-night");
  assert.equal(legacy?.id, "urban-night");
  assert.equal(legacy?.enabled, false);
  assert.equal(legacy?.generationStrategyHint, "fashion_on_model");
  assert.equal(legacy?.vertical, "apparel");

  assert.deepEqual(getHistoricalPresetMetadata("tech-launch-hero"), {
    id: "tech-launch-hero",
    title: "Tech Launch Hero",
    category: "product",
    vertical: "product",
    useCase: "product",
  });
});

test("preset selection and metadata preserve optional user customization", () => {
  const preset = requiredPreset("apparel-studio-style");
  const note = "A seated model, three-quarter view, with the front graphic fully visible.";
  const direction = buildCreativePresetDirection(note, preset);

  assert.equal(canCreateImageWithPreset(true, "", preset), true);
  assert.equal(canCreateImageWithPreset(true, note, null), true);
  assert.equal(canCreateImageWithPreset(true, "", null), false);
  assert.match(direction, /seamless warm-neutral fashion studio/i);
  assert.match(direction, /preserving all other preset defaults/i);
  assert.match(direction, /front graphic fully visible/i);
  assert.deepEqual(createCreativePresetMetadata(preset), {
    id: "apparel-studio-style",
    title: "Studio Style",
    category: "apparel",
    vertical: "apparel",
    useCase: "apparel",
  });
});

test("apparel capture remains preset-specific while other sectors have no fashion profile", () => {
  assert.equal(requiredPreset("apparel-street-style").creativeDirection.capture?.profile, "urban_night_flash");
  assert.equal(requiredPreset("apparel-scenic-editorial").creativeDirection.capture?.profile, "natural_editorial_daylight");
  assert.equal(requiredPreset("apparel-studio-style").creativeDirection.capture?.profile, "soft_studio_fashion");

  for (const preset of creativePresets.filter((candidate) => candidate.vertical !== "apparel")) {
    assert.equal(preset.creativeDirection.capture, null, `${preset.id} should not receive a fashion capture profile`);
  }
});

test("structured preset context is sent to the enhancer and keeps the capture profile", async () => {
  const preset = requiredPreset("apparel-street-style");
  const client = new CapturingEnhancementClient();
  const result = await enhanceCreativeDirectionWithClient(
    {
      enabled: true,
      generationType: "image",
      preservationMode: "reference_edit",
      presetId: preset.id,
      presetTitle: preset.title,
      presetDescription: preset.shortDescription,
      presetCreativeDirection: preset.creativeDirection,
      useCase: preset.useCase,
      generationMode: preset.generationMode,
      userCreativeDirection: "Keep the back panel visible.",
    },
    client,
  );

  assert.equal(result.succeeded, true);
  assert.equal(client.input?.presetId, preset.id);
  assert.equal(client.input?.presetCreativeDirection?.capture?.profile, "urban_night_flash");
  assert.match(result.prompt, /Capture profile: urban_night_flash/i);
});

test("watch and footwear routing uses reference editing only for worn presets", () => {
  const watchOnWrist = resolveGenerationStrategy({ preset: requiredPreset("watch-on-wrist"), userPrompt: "A warm wrist editorial." });
  const watchStudio = resolveGenerationStrategy({ preset: requiredPreset("watch-bright-studio"), userPrompt: "A watch hero." });
  const footwearStreet = resolveGenerationStrategy({ preset: requiredPreset("footwear-street-lifestyle"), userPrompt: "An on-foot editorial." });
  const footwearStudio = resolveGenerationStrategy({ preset: requiredPreset("footwear-studio"), userPrompt: "A studio footwear hero." });

  assert.equal(watchOnWrist.strategy, "watch_on_wrist");
  assert.equal(watchOnWrist.effectivePreservationMode, "reference_edit");
  assert.equal(watchStudio.effectivePreservationMode, "pixel_lock");
  assert.equal(footwearStreet.strategy, "footwear_on_model");
  assert.equal(footwearStreet.effectivePreservationMode, "reference_edit");
  assert.equal(footwearStudio.effectivePreservationMode, "pixel_lock");
});
