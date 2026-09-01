import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCreativePresetDirection,
  canCreateImageWithPreset,
  createCreativePresetMetadata,
} from "../src/lib/creative-presets/creative-preset-context";
import {
  creativePresetCategories,
  creativePresets,
  getCreativePreset,
} from "../src/lib/creative-presets/creative-presets";
import {
  enhanceCreativeDirectionWithClient,
  type CreativeBrief,
  type PromptEnhancementClient,
} from "../src/lib/generation/prompts/prompt-enhancement-core";

const validBrief: CreativeBrief = {
  subject: "The supplied product in a premium campaign setting.",
  pose: "A natural, product-led composition.",
  environment: "A considered editorial environment.",
  composition: "A balanced hero composition.",
  camera: "Commercial photography with natural perspective.",
  lighting: "Controlled premium lighting.",
  mood: "Modern and refined.",
  realism: "Photorealistic materials and detail.",
  productTreatment: "Keep the supplied product visually central.",
  negativeConstraints: "No product redesigns or added logos.",
};

class CapturingEnhancementClient implements PromptEnhancementClient {
  input: Parameters<PromptEnhancementClient["createCreativeBrief"]>[0] | null = null;

  async createCreativeBrief(input: Parameters<PromptEnhancementClient["createCreativeBrief"]>[0]) {
    this.input = input;
    return validBrief;
  }
}

test("creative preset registry contains the enabled v1 library", () => {
  assert.equal(creativePresets.length, 18);
  assert.deepEqual(
    new Set(creativePresets.map((preset) => preset.category)),
    new Set(creativePresetCategories),
  );
  assert.equal(new Set(creativePresets.map((preset) => preset.id)).size, creativePresets.length);
  assert.ok(creativePresets.every((preset) => preset.enabled && preset.promptSeed.length > 0));
});

test("preset selection validation allows a preset or a note, but never product-only", () => {
  const preset = getCreativePreset("brutalist-streetwear");
  assert.ok(preset);

  assert.equal(canCreateImageWithPreset(true, "", preset), true);
  assert.equal(canCreateImageWithPreset(true, "A seated model", null), true);
  assert.equal(canCreateImageWithPreset(true, "A seated model", preset), true);
  assert.equal(canCreateImageWithPreset(true, "", null), false);
  assert.equal(canCreateImageWithPreset(false, "A seated model", preset), false);
});

test("preset context combines the seed with an optional note and retains traceable metadata", () => {
  const preset = getCreativePreset("brutalist-streetwear");
  assert.ok(preset);

  const direction = buildCreativePresetDirection("blond male, back facing camera", preset);
  assert.ok(direction.startsWith(preset.promptSeed));
  assert.ok(direction.endsWith("blond male, back facing camera"));
  assert.deepEqual(createCreativePresetMetadata(preset), {
    id: "brutalist-streetwear",
    title: "Brutalist Streetwear",
    category: "fashion",
    useCase: "fashion",
  });
});

test("prompt enhancement receives preset context and uses its seed without a user note", async () => {
  const preset = getCreativePreset("brutalist-streetwear");
  assert.ok(preset);
  const client = new CapturingEnhancementClient();

  const result = await enhanceCreativeDirectionWithClient(
    {
      enabled: true,
      generationType: "image",
      preservationMode: "reference_edit",
      userCreativeDirection: "",
      presetId: preset.id,
      presetTitle: preset.title,
      presetDescription: preset.shortDescription,
      presetPromptSeed: preset.promptSeed,
      useCase: preset.useCase,
      generationMode: preset.generationMode,
    },
    client,
  );

  assert.equal(result.succeeded, true);
  assert.equal(client.input?.presetId, preset.id);
  assert.equal(client.input?.presetPromptSeed, preset.promptSeed);
  assert.ok(result.enhancedPrompt);
});

test("a disabled enhancer still sends the preset seed to the direct generation path", async () => {
  const preset = getCreativePreset("tech-launch-hero");
  assert.ok(preset);
  const client = new CapturingEnhancementClient();

  const result = await enhanceCreativeDirectionWithClient(
    {
      enabled: false,
      generationType: "image",
      preservationMode: "reference_edit",
      userCreativeDirection: "",
      presetPromptSeed: preset.promptSeed,
    },
    client,
  );

  assert.equal(result.prompt, preset.promptSeed);
  assert.equal(result.succeeded, false);
  assert.equal(client.input, null);
});
