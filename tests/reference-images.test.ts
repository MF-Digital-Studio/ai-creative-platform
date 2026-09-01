import assert from "node:assert/strict";
import test from "node:test";

import sharp from "sharp";

import {
  isReferenceImageMimeType,
  MAX_PROJECT_REFERENCE_IMAGES,
} from "../src/lib/assets/reference-asset-constraints";
import {
  analyzePreparedReferenceImages,
  type ReferenceAnalysisClient,
} from "../src/lib/generation/references/reference-analysis-core";
import {
  renderReferenceStyleBrief,
  type ReferenceStyleBrief,
} from "../src/lib/generation/references/reference-style-brief";
import { resolveGenerationStrategy } from "../src/lib/generation/strategy/generation-strategy";
import { createReferenceAnalysisInput } from "../src/lib/generation/references/reference-analysis-input";
import { getOpenAIDiagnostic } from "../src/lib/openai/response-diagnostics";
import { buildImageGenerationPrompt } from "../src/lib/generation/prompts/build-image-generation-prompt";
import {
  enhanceCreativeDirectionWithClient,
  type PromptEnhancementClient,
} from "../src/lib/generation/prompts/prompt-enhancement-core";

const validStyleBrief: ReferenceStyleBrief = {
  visualIntent: "Original direct-flash urban editorial photography.",
  composition: { framing: "Medium-full", cameraAngle: "Eye level", cameraDistance: "Moderate", subjectPlacement: "Off-center" },
  lighting: { character: "Direct flash", direction: "On-axis", flashBehavior: "Hard direct flash", ambientExposure: "One stop under", contrast: "Crisp" },
  environment: { setting: "Urban night exterior", architecturalCharacter: "Concrete", surfaceCharacter: "Worn pavement" },
  color: { palette: "Cool neutrals", grading: "Restrained", saturation: "Moderate" },
  texture: { grain: "Fine grain", sharpness: "Natural", retouching: "Light" },
  depthOfField: "Moderate depth", poseLanguage: "Relaxed and grounded", realismCharacter: "Believable editorial photography",
};

class FakeReferenceClient implements ReferenceAnalysisClient {
  callCount = 0;
  receivedCount = 0;

  constructor(private readonly result: unknown | Error = validStyleBrief) {}

  async createStyleBrief(images: Parameters<ReferenceAnalysisClient["createStyleBrief"]>[0]) {
    this.callCount += 1;
    this.receivedCount = images.length;
    if (this.result instanceof Error) throw this.result;
    return this.result;
  }
}

async function validImage() {
  return sharp({ create: { width: 24, height: 16, channels: 3, background: "#222" } }).png().toBuffer();
}

test("reference assets accept only supported image MIME types and cap projects at three", () => {
  assert.equal(MAX_PROJECT_REFERENCE_IMAGES, 3);
  assert.equal(isReferenceImageMimeType("image/jpeg"), true);
  assert.equal(isReferenceImageMimeType("image/png"), true);
  assert.equal(isReferenceImageMimeType("image/webp"), true);
  assert.equal(isReferenceImageMimeType("image/gif"), false);
});

test("one or three references make one combined analysis call", async () => {
  const image = await validImage();
  const client = new FakeReferenceClient();
  const result = await analyzePreparedReferenceImages([
    { data: image, mimeType: "image/png" },
    { data: image, mimeType: "image/png" },
    { data: image, mimeType: "image/png" },
  ], client);

  assert.equal(client.callCount, 1);
  assert.equal(client.receivedCount, 3);
  assert.deepEqual(result.styleBrief, validStyleBrief);
  assert.equal(result.usableCount, 3);
});

test("reference analysis input uses one message with correctly typed data URLs", () => {
  const input = createReferenceAnalysisInput([
    { data: Buffer.from("jpeg-source"), mimeType: "image/jpeg" },
    { data: Buffer.from("webp-source"), mimeType: "image/webp" },
  ]);
  const images = input[0].content.filter((part) => part.type === "input_image");

  assert.equal(input.length, 1);
  assert.equal(images.length, 2);
  assert.equal(images[0]?.image_url, `data:image/jpeg;base64,${Buffer.from("jpeg-source").toString("base64")}`);
  assert.equal(images[1]?.image_url, `data:image/webp;base64,${Buffer.from("webp-source").toString("base64")}`);
});

test("no references skip vision analysis, while corrupt or failed references fall back safely", async () => {
  const client = new FakeReferenceClient();
  const noReferences = await analyzePreparedReferenceImages([], client);
  assert.equal(client.callCount, 0);
  assert.equal(noReferences.styleBrief, null);

  const invalid = await analyzePreparedReferenceImages([{ data: Buffer.from("corrupt"), mimeType: "image/png" }], new FakeReferenceClient({ invalid: true }));
  assert.equal(invalid.styleBrief, null);
  assert.equal(invalid.usableCount, 1);

  const image = await validImage();
  const unavailable = await analyzePreparedReferenceImages([{ data: image, mimeType: "image/png" }], new FakeReferenceClient(new Error("network")));
  assert.equal(unavailable.styleBrief, null);
  assert.equal(unavailable.usableCount, 1);
});

test("reference style rendering forbids copying reference identity and product details", () => {
  const rendered = renderReferenceStyleBrief(validStyleBrief);
  assert.match(rendered, /style only/i);
  assert.match(rendered, /never copy reference products, identities, logos, text/i);
});

test("OpenAI diagnostics retain safe categories but never image data, URLs, or API keys", () => {
  const diagnostic = getOpenAIDiagnostic({
    status: 400,
    type: "invalid_request_error",
    code: "unsupported_parameter",
    message: "Unsupported data:image/jpeg;base64,abc123 https://private.example/image sk-secret-token",
  });

  assert.equal(diagnostic.status, 400);
  assert.equal(diagnostic.errorType, "invalid_request_error");
  assert.equal(diagnostic.errorCode, "unsupported_parameter");
  assert.doesNotMatch(diagnostic.safeMessage, /abc123|private\.example|sk-secret-token/);
});

test("reference visual direction cannot change generation strategy", () => {
  const dualSense = resolveGenerationStrategy({
    productContext: { category: "product" },
    userPrompt: "Place the supplied controller on a desk.",
  });
  const hoodie = resolveGenerationStrategy({
    productContext: { category: "fashion" },
    userPrompt: "A clean campaign image.",
  });
  const jewelry = resolveGenerationStrategy({
    productContext: { category: "jewelry", subjectType: "on_model" },
    userPrompt: "A campaign image.",
  });

  assert.equal(dualSense.strategy, "rigid_product");
  assert.equal(hoodie.strategy, "fashion_on_model");
  assert.equal(jewelry.strategy, "jewelry_on_model");
});

test("an explicit user note follows and overrides reference visual direction in deterministic context", async () => {
  const client: PromptEnhancementClient = { createCreativeBrief: async () => validStyleBrief };
  const result = await enhanceCreativeDirectionWithClient({
    enabled: false,
    generationType: "image",
    preservationMode: "reference_edit",
    referenceStyle: validStyleBrief,
    userCreativeDirection: "Model sitting on the floor with their back facing the camera.",
  }, client);

  assert.match(result.prompt, /Pose language: Relaxed and grounded/i);
  assert.match(result.prompt, /User customization \(highest creative priority\).*sitting on the floor/i);
  assert.ok(result.prompt.indexOf("Pose language") < result.prompt.indexOf("User customization"));
});

test("a successful reference brief propagates into the final provider prompt", async () => {
  const client: PromptEnhancementClient = { createCreativeBrief: async () => validStyleBrief };
  const context = await enhanceCreativeDirectionWithClient({
    enabled: false,
    generationType: "image",
    preservationMode: "reference_edit",
    referenceStyle: validStyleBrief,
    userCreativeDirection: "A model wearing this hoodie.",
  }, client);
  const prompt = buildImageGenerationPrompt(context.prompt, "reference_edit", { strategy: "fashion_on_model" });

  assert.match(prompt, /Direct flash/i);
  assert.match(prompt, /One stop under/i);
  assert.match(prompt, /Fine grain/i);
  assert.match(prompt, /Texture: Fine grain; Natural; Light/i);
});

test("presetless explicit on-model apparel wording selects fashion reference editing", () => {
  const result = resolveGenerationStrategy({
    userPrompt: "Blond male model wearing this hoodie, sitting on the ground, back facing the camera.",
  });

  assert.equal(result.strategy, "fashion_on_model");
  assert.equal(result.effectivePreservationMode, "reference_edit");
});
