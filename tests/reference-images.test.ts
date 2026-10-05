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
import { orderGenerationImages, orderReferenceReplacementImages, compileImageRoleInstructions } from "../src/lib/generation/image-roles";
import { buildReferenceReplacementPrompt } from "../src/lib/generation/image-roles";
import { mapStructuredValidationOutput, resolveQualityGate } from "../src/lib/fidelity-validation/resolve-quality-gate";
import { resolveRepairEligibility } from "../src/lib/generation/execution-policy/resolve-repair-eligibility";
import { resolveRepairPlan } from "../src/lib/auto-repair/resolve-repair-plan";
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
  assert.match(rendered, /Reference 1 is the primary authority/i);
  assert.match(rendered, /References 2 and 3 are supporting references/i);
  assert.match(rendered, /uploaded source product is the highest authority/i);
  assert.match(rendered, /source product is the highest authority/i);
  assert.doesNotMatch(rendered, /copy reference product identity/i);
});

test("upload order assigns one primary and remaining supporting roles, including after removal", () => {
  const assets = ["a", "b", "c"].map((id) => ({ id, bucketId: "source", objectPath: id, data: Buffer.from(id), mimeType: "image/png" }));
  assert.deepEqual(orderGenerationImages(assets[0]!, assets.slice(1)).filter((image) => image.referenceRole).map((image) => [image.id, image.referenceRole]), [["b", "primary"], ["c", "supporting"]]);
  assert.deepEqual(orderGenerationImages(assets[0]!, [assets[2]!]).filter((image) => image.referenceRole).map((image) => [image.id, image.referenceRole]), [["c", "primary"]]);
  assert.deepEqual(orderGenerationImages(assets[0]!).filter((image) => image.referenceRole), []);
});

test("primary role instructions protect pose and framing while source product stays authoritative", () => {
  const assets = ["primary", "support1", "support2"].map((id) => ({ id, bucketId: "source", objectPath: id, data: Buffer.from(id), mimeType: "image/png" }));
  const images = orderGenerationImages(assets[0]!, assets.slice(1));
  const instructions = compileImageRoleInstructions(images);
  assert.match(instructions, /PRIMARY and governs scene.*subject pose.*framing/i);
  assert.match(instructions, /SUPPORTING.*lighting, mood, color/i);
  assert.match(instructions, /never transfer reference product identity/i);
  assert.match(buildReferenceReplacementPrompt("Make it nighttime"), /SOURCE PRODUCT.*EXACT IDENTITY/i);
});

test("direct replacement keeps primary reference before source product in provider order", () => {
  const scene = { id: "reference", bucketId: "source", objectPath: "ref", data: Buffer.from("ref"), mimeType: "image/png" };
  const product = { ...scene, id: "product", objectPath: "product" };
  const ordered = orderReferenceReplacementImages(scene, product);
  assert.deepEqual(ordered.map((image) => image.role), ["reference_base_scene", "product_identity_source"]);
  assert.equal(ordered[0]?.referenceRole, "primary");
});

test("supporting style mismatch stays a warning and cannot trigger repair", () => {
  const validation = resolveQualityGate([{ code: "supporting_reference_style_missed", category: "reference_match", severity: "critical", confidence: 1, identityImpact: "critical", finding: "style differs", expected: "supporting mood", sourceAuthoritative: false }]);
  assert.equal(validation.status, "pass_with_warnings");
  assert.equal(validation.issues[0]?.severity, "minor");
  assert.equal(resolveRepairPlan(validation).shouldRetry, false);
});

test("jewelry reference prompt suppresses reference jewelry while preserving source identity authority", () => {
  const source = { id: "source", bucketId: "source", objectPath: "source", data: Buffer.from("source"), mimeType: "image/png" };
  const reference = { ...source, id: "primary", objectPath: "primary" };
  const jewelryProfile = { vertical: "jewelry", subcategory: "ring", verticalAttributes: { vertical: "jewelry", details: {} } } as never;
  const prompt = buildImageGenerationPrompt("Keep the reference hand pose.", "reference_edit", { strategy: "jewelry_on_model", productProfile: jewelryProfile, generationImages: orderGenerationImages(source, [reference]) });
  assert.match(prompt, /JEWELRY REFERENCE FIDELITY V2/);
  assert.match(prompt, /placeholder jewelry position only/i);
  assert.match(prompt, /prong count and placement/i);
  const presetOnlyPrompt = buildImageGenerationPrompt("A solitaire ring on white fabric.", "reference_edit", { strategy: "jewelry_still_life", productProfile: jewelryProfile });
  assert.doesNotMatch(presetOnlyPrompt, /JEWELRY REFERENCE FIDELITY V2/);
});

test("high-confidence jewelry identity drift fails independently and qualifies for one targeted repair", () => {
  const validation = resolveQualityGate(mapStructuredValidationOutput({ findings: [{ code: "JEWELRY_PRONG_COUNT_DRIFT", category: "geometry", severity: "critical", confidence: .96, identityImpact: "critical", finding: "Wrong prong count", expected: "Source prong count", sourceAuthoritative: true }] }));
  assert.equal(validation.status, "fail");
  assert.equal(validation.issues[0]?.category, "product_identity");
  const eligibility = resolveRepairEligibility({ validation, exactProduct: false, hybridProjectionApplied: false, maximumAttemptsRemaining: true });
  assert.equal(eligibility.eligible, true);
  assert.equal(eligibility.reason, "critical_jewelry_identity_drift_targeted_repair");
  const plan = resolveRepairPlan(validation);
  assert.equal(plan.shouldRetry, true);
  assert.match(plan.repairInstructions.join(" "), /JEWELRY ONLY.*preserve the generated scene unchanged/i);
});

test("minor jewelry perspective and reflection variation does not qualify for repair", () => {
  const validation = resolveQualityGate([{ code: "jewelry_band_geometry_drift", category: "product_identity", severity: "minor", confidence: .42, identityImpact: "minor", finding: "Apparent width differs by perspective", expected: "Allow optical variation", sourceAuthoritative: true }]);
  assert.notEqual(validation.status, "fail");
  assert.equal(resolveRepairEligibility({ validation, exactProduct: false, hybridProjectionApplied: false, maximumAttemptsRemaining: true }).eligible, false);
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
  assert.equal(diagnostic.param, null);
  assert.doesNotMatch(diagnostic.safeMessage, /abc123|private\.example|sk-secret-token/);
});

test("reference visual direction cannot change generation strategy", () => {
  const dualSense = resolveGenerationStrategy({
    productContext: { category: "cosmetics" },
    userPrompt: "Place the supplied controller on a desk.",
  });
  const hoodie = resolveGenerationStrategy({
    productContext: { category: "apparel" },
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
