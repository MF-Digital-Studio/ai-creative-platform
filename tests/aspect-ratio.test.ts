import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_GENERATION_ASPECT_RATIO, GENERATION_ASPECT_RATIOS, isGenerationAspectRatio } from "../src/lib/generation/aspect-ratios";
import { resolveImageGenerationOutputCanvas, resolveProviderImageSize } from "../src/lib/generation/output-canvas";
import { compileOutputFormatGuidance } from "../src/lib/generation/prompts/build-image-generation-prompt";

test("the image format defaults to the existing square behavior", () => {
  assert.equal(DEFAULT_GENERATION_ASPECT_RATIO, "1:1");
});

test("exactly the six supported formats are valid", () => {
  assert.deepEqual(GENERATION_ASPECT_RATIOS.map(({ value }) => value), ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"]);
  for (const { value } of GENERATION_ASPECT_RATIOS) assert.equal(isGenerationAspectRatio(value), true);
  assert.equal(isGenerationAspectRatio("4:5"), false);
  assert.equal(isGenerationAspectRatio("square"), false);
});

test("Sunburst receives exact supported dimensions for each semantic ratio", () => {
  const expected = { "16:9": "1536x864", "9:16": "864x1536", "1:1": "1024x1024", "4:3": "1536x1152", "3:4": "1152x1536", "21:9": "2688x1152" } as const;
  for (const [ratio, dimensions] of Object.entries(expected)) {
    const resolved = resolveProviderImageSize("gpt-image-2.5-sunburst", ratio as keyof typeof expected);
    assert.equal(resolved.providerValue, dimensions);
    assert.deepEqual(resolveImageGenerationOutputCanvas(ratio as keyof typeof expected), { width: resolved.width, height: resolved.height });
    const [width, height] = dimensions.split("x").map(Number);
    const [ratioWidth, ratioHeight] = ratio.split(":").map(Number);
    assert.equal(width * ratioHeight, height * ratioWidth);
  }
});

test("unsupported models fail without substituting a different canvas", () => {
  assert.throws(() => resolveProviderImageSize("legacy-image-model", "16:9"), /does not support requested format/);
});

test("output-format guidance preserves product visibility and reference canvas authority", () => {
  assert.match(compileOutputFormatGuidance("21:9"), /very wide cinematic 21:9/);
  assert.match(compileOutputFormatGuidance("21:9"), /full product visible/);
  assert.match(compileOutputFormatGuidance("9:16"), /vertical safe area/);
  assert.match(compileOutputFormatGuidance("16:9"), /reference images must adapt to this final canvas/);
});
