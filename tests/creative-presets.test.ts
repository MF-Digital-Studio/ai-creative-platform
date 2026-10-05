import assert from "node:assert/strict";
import { existsSync } from "node:fs";
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
  buildPresetVariantDirection,
  getPresetFamily,
  getRecommendedFamilyPresets,
  historicalUnsupportedPresetIds,
} from "../src/lib/creative-presets/creative-presets";
import { creativeBriefFields, type CreativeBrief } from "../src/lib/generation/prompts/creative-brief";
import { getVerticalQualityProfile } from "../src/lib/generation/quality/vertical-quality-profiles";
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

test("public preset families match every vertical and keep eight internal variants each", () => {
  const expected: Record<(typeof supportedVerticals)[number], number> = {
    apparel: 3, watches: 3, jewelry: 3, footwear: 3, cosmetics: 2, bags: 3,
  };
  assert.equal(presetFamilies.length, 17);
  for (const vertical of supportedVerticals) {
    const families = presetFamilies.filter((family) => family.vertical === vertical);
    assert.equal(families.length, expected[vertical]);
    for (const family of families) {
      assert.equal(family.variants.length, 8);
      assert.ok(family.variants.every((variant) => variant.familyId === family.id));
      assert.ok(family.variants.every((variant) => variant.environmentDirection && variant.lightingDirection && variant.compositionDirection));
    }
  }
});

test("variant selection is deterministic, valid, and avoids the most recent alternative", () => {
  const family = getPresetFamily("apparel-street");
  assert.ok(family);
  const first = resolvePresetVariant({ family, generationSeed: "generation-a" });
  const next = resolvePresetVariant({ family, generationSeed: "generation-b", previousVariantId: first.id });
  assert.ok(family.variants.some((variant) => variant.id === next.id));
  assert.notEqual(next.id, first.id);
  assert.equal(resolvePresetVariant({ family, generationSeed: "generation-a" }).id, first.id);
});

test("family and resolved variant metadata persist with the v2 version", () => {
  const preset = requiredPreset("bags-on-model");
  const variant = getPresetFamily(preset.id)?.variants[0];
  assert.ok(variant);
  assert.deepEqual(createCreativePresetMetadata(preset, variant.id), {
    id: "bags-on-model", title: "On model", category: "bags", vertical: "bags", useCase: "bags",
    version: "preset-system-v2", familyId: "bags-on-model", variantId: variant.id,
  });
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
