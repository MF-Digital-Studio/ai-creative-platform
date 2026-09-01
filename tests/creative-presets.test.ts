import assert from "node:assert/strict";
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
  getCreativePreset,
} from "../src/lib/creative-presets/creative-presets";
import { creativeBriefFields, type CreativeBrief } from "../src/lib/generation/prompts/creative-brief";
import {
  enhanceCreativeDirectionWithClient,
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
  capture: null,
};

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

test("all 20 presets contain complete, production-quality creative directions", () => {
  assert.equal(creativePresets.length, 20);
  assert.deepEqual(
    new Set(creativePresets.map((preset) => preset.category)),
    new Set(creativePresetCategories),
  );
  assert.equal(new Set(creativePresets.map((preset) => preset.id)).size, creativePresets.length);

  for (const preset of creativePresets) {
    for (const field of creativeBriefFields) {
      assert.ok(preset.creativeDirection[field].trim().length >= 25, `${preset.id}.${field} is too vague.`);
    }
  }
});

test("Urban Night includes deterministic on-model night-fashion production context", () => {
  const direction = requiredPreset("urban-night").creativeDirection;
  const rendered = renderPresetCreativeDirection(requiredPreset("urban-night")).toLowerCase();

  assert.match(direction.subject, /one adult fashion model/i);
  assert.match(direction.environment, /city street|storefront|architectural facade/i);
  assert.match(direction.lighting, /street|storefront|architectural light/i);
  assert.match(direction.pose, /standing editorial pose/i);
  assert.match(direction.composition, /medium-to-full fashion framing/i);
  assert.match(direction.productTreatment, /garment/i);
  assert.match(direction.negativeConstraints, /cyberpunk|neon|second model/i);
  assert.ok(rendered.split(/\s+/).length >= 150);
  assert.equal(direction.capture?.profile, "urban_night_flash");
});

test("Back Print Focus explicitly protects the back-facing view and print visibility", () => {
  const direction = requiredPreset("back-print-focus").creativeDirection;
  assert.match(direction.subject, /back facing the camera/i);
  assert.match(direction.composition, /print completely visible/i);
  assert.match(direction.productTreatment, /back artwork/i);
  assert.match(direction.negativeConstraints, /hair or hands covering/i);
});

test("Tech Launch Hero protects a single commercial hero product from clutter", () => {
  const direction = requiredPreset("tech-launch-hero").creativeDirection;
  assert.match(direction.subject, /one supplied technology product/i);
  assert.match(direction.lighting, /low-key key light.*rim light/i);
  assert.match(direction.negativeConstraints, /duplicate product.*random futuristic clutter/i);
});

test("direct preset rendering preserves distinct style directions", () => {
  const urban = renderPresetCreativeDirection(requiredPreset("urban-night"));
  const daylight = renderPresetCreativeDirection(requiredPreset("soft-daylight-product"));
  const macro = renderPresetCreativeDirection(requiredPreset("luxury-macro-jewelry"));

  assert.notEqual(urban, daylight);
  assert.notEqual(daylight, macro);
  assert.match(urban, /night/i);
  assert.match(daylight, /bright diffused daylight/i);
  assert.match(macro, /macro commercial photograph/i);
});

test("preset selection validation allows a preset or a note, but never product-only", () => {
  const preset = requiredPreset("brutalist-streetwear");
  assert.equal(canCreateImageWithPreset(true, "", preset), true);
  assert.equal(canCreateImageWithPreset(true, "A seated model", null), true);
  assert.equal(canCreateImageWithPreset(true, "A seated model", preset), true);
  assert.equal(canCreateImageWithPreset(true, "", null), false);
  assert.equal(canCreateImageWithPreset(false, "A seated model", preset), false);
});

test("preset renderer keeps defaults while adding a user customization", () => {
  const preset = requiredPreset("brutalist-streetwear");
  const direction = buildCreativePresetDirection(
    "blond male model sitting on the ground with his back facing camera",
    preset,
  );

  assert.match(direction, /brutalist concrete architecture/i);
  assert.match(direction, /preserving all other preset defaults/i);
  assert.match(direction, /blond male model sitting on the ground with his back facing camera/i);
  assert.deepEqual(createCreativePresetMetadata(preset), {
    id: "brutalist-streetwear",
    title: "Brutalist Streetwear",
    category: "fashion",
    useCase: "fashion",
  });
});

test("preset-only enhance-off generation renders a complete professional direct prompt", async () => {
  const preset = requiredPreset("urban-night");
  const client = new CapturingEnhancementClient();
  const result = await enhanceCreativeDirectionWithClient(
    {
      enabled: false,
      generationType: "image",
      preservationMode: "reference_edit",
      userCreativeDirection: "",
      presetCreativeDirection: preset.creativeDirection,
    },
    client,
  );

  assert.equal(result.succeeded, false);
  assert.equal(client.input, null);
  assert.match(result.prompt, /Professional creative direction/);
  assert.match(result.prompt, /One adult fashion model/i);
  assert.ok(result.prompt.split(/\s+/).length >= 150);
});

test("preset-only enhance-on generation sends the structured preset direction to the enhancer", async () => {
  const preset = requiredPreset("urban-night");
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
      presetCreativeDirection: preset.creativeDirection,
      useCase: preset.useCase,
      generationMode: preset.generationMode,
    },
    client,
  );

  assert.equal(result.succeeded, true);
  assert.equal(client.input?.presetId, preset.id);
  assert.deepEqual(client.input?.presetCreativeDirection, preset.creativeDirection);
  assert.equal(client.input?.userCreativeDirection, "");
  assert.ok(result.enhancedPrompt);
});

test("preset plus user note retains structured defaults and passes customization separately", async () => {
  const preset = requiredPreset("brutalist-streetwear");
  const note = "blond male model sitting on the ground with his back facing camera";
  const client = new CapturingEnhancementClient();

  await enhanceCreativeDirectionWithClient(
    {
      enabled: true,
      generationType: "image",
      preservationMode: "reference_edit",
      userCreativeDirection: note,
      presetCreativeDirection: preset.creativeDirection,
    },
    client,
  );

  assert.equal(client.input?.userCreativeDirection, note);
  assert.match(client.input?.presetCreativeDirection?.environment ?? "", /brutalist concrete architecture/i);
  assert.match(client.input?.presetCreativeDirection?.realism ?? "", /Photorealistic/i);
});

test("every fashion preset has a typed capture profile", () => {
  for (const preset of creativePresets.filter((candidate) => candidate.category === "fashion")) {
    assert.ok(preset.creativeDirection.capture, `${preset.id} is missing a capture profile.`);
  }
});

test("Editorial Flash contains direct flash, darker ambient exposure, and realistic grain", () => {
  const direction = requiredPreset("editorial-flash").creativeDirection;
  const rendered = renderPresetCreativeDirection(requiredPreset("editorial-flash"));

  assert.equal(direction.capture?.profile, "editorial_flash");
  assert.match(direction.capture?.flashBehavior ?? "", /direct on-camera flash/i);
  assert.match(direction.capture?.ambientExposure ?? "", /one stop darker/i);
  assert.match(direction.capture?.grain ?? "", /subtle realistic fine grain/i);
  assert.match(rendered, /Capture profile: editorial_flash/i);
});

test("Minimal Studio Fashion keeps soft studio capture and never inherits night flash", () => {
  const direction = requiredPreset("minimal-studio-fashion").creativeDirection;
  const rendered = renderPresetCreativeDirection(requiredPreset("minimal-studio-fashion"));

  assert.equal(direction.capture?.profile, "soft_studio_fashion");
  assert.doesNotMatch(rendered, /urban_night_flash|high-ISO|city ambience/i);
  assert.match(rendered, /large soft directional source/i);
});

test("different fashion capture profiles render meaningfully different photography directions", () => {
  const flash = renderPresetCreativeDirection(requiredPreset("editorial-flash"));
  const daylight = renderPresetCreativeDirection(requiredPreset("on-model-editorial"));
  const studio = renderPresetCreativeDirection(requiredPreset("minimal-studio-fashion"));

  assert.notEqual(flash, daylight);
  assert.notEqual(daylight, studio);
  assert.match(flash, /on-camera flash/i);
  assert.match(daylight, /directional daylight/i);
  assert.match(studio, /large soft directional source/i);
});

test("jewelry and product presets retain their existing prompt behavior without fashion capture context", () => {
  for (const preset of creativePresets.filter((candidate) => candidate.category !== "fashion")) {
    assert.equal(preset.creativeDirection.capture, null, `${preset.id} should not receive fashion capture context.`);
    assert.doesNotMatch(renderPresetCreativeDirection(preset), /Capture profile:/i);
  }
});

test("fashion user notes preserve the preset capture profile during enhancement", async () => {
  const preset = requiredPreset("urban-night");
  const client = new CapturingEnhancementClient();
  const result = await enhanceCreativeDirectionWithClient(
    {
      enabled: true,
      generationType: "image",
      preservationMode: "reference_edit",
      useCase: "fashion",
      presetCreativeDirection: preset.creativeDirection,
      userCreativeDirection: "blond male facing camera",
    },
    client,
  );

  assert.equal(client.input?.presetCreativeDirection?.capture?.profile, "urban_night_flash");
  assert.match(result.prompt, /Capture profile: urban_night_flash/i);
});

test("no-preset custom prompt flow remains raw and unchanged", async () => {
  const client = new CapturingEnhancementClient();
  const note = "put it on a table in dim lighting";
  const result = await enhanceCreativeDirectionWithClient(
    {
      enabled: false,
      generationType: "image",
      preservationMode: "reference_edit",
      userCreativeDirection: note,
    },
    client,
  );

  assert.equal(result.prompt, note);
  assert.equal(client.input, null);
});

test("Tech Launch Hero direct renderer keeps table and dim-light customizations with campaign defaults", () => {
  const direction = renderPresetCreativeDirection(
    requiredPreset("tech-launch-hero"),
    "put it on a table in dim lighting",
  );

  assert.match(direction, /technology product/i);
  assert.match(direction, /low-key key light/i);
  assert.match(direction, /table in dim lighting/i);
  assert.match(direction, /single product|one hero product/i);
});
