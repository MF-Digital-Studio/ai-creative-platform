import assert from "node:assert/strict";
import test from "node:test";

import { getSafeProviderErrorDiagnostics } from "../src/lib/generation/providers/provider-error-diagnostics";
import { getImageModelCapabilities } from "../src/lib/generation/providers/image-model-capabilities";
import { buildOpenAIImageEditParams } from "../src/lib/generation/providers/openai-image-request";
import { orderGenerationImages } from "../src/lib/generation/image-roles";
import { validateGenerationPolicy } from "../src/lib/generation/strategy/validate-generation-policy";
import type { ImageGenerationQuality } from "../src/lib/generation/types";

test("jewelry on body normalizes to jewelry on model and reference edit", () => {
  const result = validateGenerationPolicy({ strategy: "jewelry_still_life", sceneFamily: "jewelry_on_body", preservationMode: "pixel_lock", hasUsableMask: false, vertical: "jewelry" });
  assert.equal(result.strategy, "jewelry_on_model");
  assert.equal(result.preservationMode, "reference_edit");
});

test("pixel lock falls back only when its still-life mask is unavailable", () => {
  const missing = validateGenerationPolicy({ strategy: "jewelry_still_life", sceneFamily: "jewelry_studio", preservationMode: "pixel_lock", hasUsableMask: false, vertical: "jewelry" });
  const valid = validateGenerationPolicy({ strategy: "jewelry_still_life", sceneFamily: "jewelry_studio", preservationMode: "pixel_lock", hasUsableMask: true, vertical: "jewelry" });
  assert.equal(missing.preservationMode, "reference_edit");
  assert.equal(valid.preservationMode, "pixel_lock");
});

test("vertical-incompatible strategy is normalized before provider work", () => {
  const result = validateGenerationPolicy({ strategy: "fashion_on_model", sceneFamily: "jewelry_studio", preservationMode: "reference_edit", hasUsableMask: true, vertical: "jewelry" });
  assert.equal(result.strategy, "jewelry_still_life");
});

test("provider error diagnostics include safe OpenAI fields only", () => {
  const error = Object.assign(new Error("Bad request"), { status: 400, code: "invalid_image", type: "invalid_request_error", param: "image" });
  const details = getSafeProviderErrorDiagnostics(error, { generationId: "generation-1", provider: "openai", model: "gpt-image-1", imageCount: 2, preservationMode: "reference_edit", strategy: "jewelry_on_model", sceneFamily: "jewelry_on_body" });
  assert.deepEqual(details, { generationId: "generation-1", provider: "openai", model: "gpt-image-1", status: 400, code: "invalid_image", type: "invalid_request_error", param: "image", message: "Bad request", imageCount: 2, preservationMode: "reference_edit", strategy: "jewelry_on_model", sceneFamily: "jewelry_on_body" });
  assert.equal(JSON.stringify(details).includes("base64"), false);
});

test("gpt-image-2 omits explicit input fidelity while retaining every edit image", () => {
  const params = buildOpenAIImageEditParams({ model: "gpt-image-2-2026-04-21", image: ["source", "reference"], prompt: "test", size: "1024x1024", quality: null });
  assert.equal("input_fidelity" in params, false);
  assert.deepEqual(params.image, ["source", "reference"]);
  assert.equal(getImageModelCapabilities("gpt-image-2").supportsExplicitInputFidelity, false);
});

test("Image 2.5 Sunburst and Flare snapshots support extended quality without input fidelity", () => {
  for (const model of ["gpt-image-2.5-sunburst", "gpt-image-2.5-sunburst-2026-10-01", "gpt-image-2.5-flare", "gpt-image-2.5-flare-2026-10-01"]) {
    const capabilities = getImageModelCapabilities(model);
    assert.equal(capabilities.supportsExtendedQuality, true);
    assert.equal(capabilities.supportsExplicitInputFidelity, false);
    assert.equal(capabilities.supportsMultiImageEdit, true);
    assert.equal(capabilities.supportsFlexibleSize, true);
    assert.ok(capabilities.supportedQualities.includes("xhigh"));
    assert.ok(capabilities.supportedQualities.includes("max"));
    for (const quality of ["low", "medium", "auto"] as const) {
      assert.ok(capabilities.supportedQualities.includes(quality));
    }
    for (const quality of ["xhigh", "max"] as const) {
      const images = ["product", "artwork", "reference"];
      const params = buildOpenAIImageEditParams({ model, image: images, prompt: "test", size: "1024x1536", quality });
      assert.equal(params.quality, quality);
      assert.equal("input_fidelity" in params, false);
      assert.deepEqual(params.image, images);
    }
  }
  assert.equal(getImageModelCapabilities("unknown-model").supportsExtendedQuality, false);
});

test("generation quality type covers persisted provider qualities and legacy values", () => {
  const persistedQualities: readonly ImageGenerationQuality[] = [
    "preview", "standard", "low", "medium", "high", "xhigh", "max", "auto",
  ];
  assert.deepEqual(persistedQualities, ["preview", "standard", "low", "medium", "high", "xhigh", "max", "auto"]);
});

test("Sunburst production default remains xhigh and other models remain standard", () => {
  const resolveDefault = (model: string) => model.startsWith("gpt-image-2.5-sunburst") ? "xhigh" : "standard";
  assert.equal(resolveDefault("gpt-image-2.5-sunburst"), "xhigh");
  assert.equal(resolveDefault("gpt-image-1"), "standard");
});

test("generation image ordering keeps source first and references deterministic", () => {
  const images = orderGenerationImages(
    { id: "source", bucketId: "assets", objectPath: "source.png", data: Buffer.from("source"), mimeType: "image/png" },
    [
      { id: "reference-1", bucketId: "assets", objectPath: "reference-1.png", data: Buffer.from("one"), mimeType: "image/png" },
      { id: "reference-2", bucketId: "assets", objectPath: "reference-2.png", data: Buffer.from("two"), mimeType: "image/png" },
    ],
  );
  assert.deepEqual(images.map(({ id, role, order }) => ({ id, role, order })), [
    { id: "source", role: "product_identity_source", order: 0 },
    { id: "reference-1", role: "scene_reference", order: 1 },
    { id: "reference-2", role: "style_reference", order: 2 },
  ]);
});

test("compatible older models include input fidelity and omit unsupported undefined values", () => {
  const params = buildOpenAIImageEditParams({ model: "gpt-image-1", image: "source", prompt: "test", size: "1024x1024", quality: null });
  assert.equal(params.input_fidelity, "high");
  assert.equal("quality" in params, false);
  assert.equal(Object.values(params).some((value) => value === undefined), false);
  assert.equal(getImageModelCapabilities("unknown-model").supportsExplicitInputFidelity, false);
});
