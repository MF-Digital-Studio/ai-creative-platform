import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { APIError } from "openai";
import "../node_modules/next/dist/compiled/server-only/empty.js";
import { OpenAIImageProvider } from "../src/lib/generation/providers/openai-image-provider";
import { buildImageGenerationPrompt } from "../src/lib/generation/prompts/build-image-generation-prompt";
import { resolveGenerationExecutionPolicy } from "../src/lib/generation/execution-policy/resolve-generation-execution-policy";
import { resolveRepairEligibility } from "../src/lib/generation/execution-policy/resolve-repair-eligibility";
import { validateGeneratedImageBestEffort } from "../src/lib/fidelity-validation/validate-generated-image";
import { buildProductIdentityManifest } from "../src/lib/product-identity/build-product-identity-manifest";
import { resolveSceneSuitability } from "../src/lib/scene-suitability/resolve-scene-suitability";
import { resolveComposition } from "../src/lib/composition-intelligence/resolve-composition";
import { resolveHumanRealismPolicy } from "../src/lib/human-realism/human-realism-policy";
import { compileRepairInstructions } from "../src/lib/auto-repair/compile-repair-instructions";
import { resolveRepairPlan } from "../src/lib/auto-repair/resolve-repair-plan";
import type { ProductProfile } from "../src/lib/product-understanding/product-profile";
import type { GenerationStrategy } from "../src/lib/generation/strategy/generation-strategy";
import type { FidelityValidationResult } from "../src/lib/fidelity-validation/types";

async function main() {
const root = process.cwd();
const sourcePath = path.join(root, "public/workspace-demo/cosmetics/product.webp");
const outputDir = path.join(root, "benchmark-output/cosmetics-2026-10-04");
const source = await readFile(sourcePath);
const asset = { id: "cosmetics-demo-product", bucketId: "benchmark", objectPath: "cosmetics/product.webp", data: source, mimeType: "image/webp" };
const profile: ProductProfile = {
  productId: asset.id, schemaVersion: 1, analysisVersion: "benchmark-manual-profile-v1", vertical: "cosmetics", subcategory: "amber-glass face serum dropper bottle", wearability: "non_wearable", rigidity: "rigid",
  materials: ["transparent amber glass", "ivory plastic dropper cap", "paper label"], dominantColors: ["amber brown", "ivory"], productShape: "rectangular amber glass serum bottle with rounded shoulders and white dropper",
  identityCriticalAttributes: ["rectangular amber-glass bottle body", "short rounded shoulders", "white cylindrical pipette collar", "long rounded white dropper bulb", "blank rectangular front label"].map((attribute) => ({ attribute, rationale: "visible in source", regions: [] })),
  visibleBranding: { hasLogo: false, hasReadableText: false, hasArtwork: false, logoRegions: [], textRegions: [], artworkRegions: [] }, interactionTargets: ["hand", "none"],
  allowedTransformations: ["perspective_change", "lighting_or_reflection_change"], forbiddenTransformations: ["recolor", "label_redesign", "packaging_redesign", "geometry_redesign", "text_or_artwork_change"],
  sceneAffinities: { recommendedSceneTags: ["cosmetics_studio", "beauty"], discouragedSceneTags: [] }, confidence: { overall: 0.94 },
  source: { model: "manual-benchmark-inspection", analysisVersion: "benchmark-manual-profile-v1", analyzedAt: "2026-10-04" },
  verticalAttributes: { vertical: "cosmetics", details: { packageType: "face serum", packageGeometry: "rectangular amber glass bottle with rounded shoulders", containerForm: "bottle", closureOrDispenser: "dropper", materialOpacity: "transparent", liquidVisibility: "visible", labelRegions: [{ location: "front center", description: "blank ivory rectangular label" }], logoRegions: [] } },
};
const manifest = buildProductIdentityManifest(profile);
const provider = new OpenAIImageProvider();
const policyInputs = { productProfile: profile, hasReference: false, referenceReplacement: false, exactProduct: false, artworkLocalized: false, presetConfidence: "high" as const, hasCustomNote: false, ambiguousNote: false };
const cases: Array<{ id: string; quality: "high" | "xhigh"; strategy: GenerationStrategy; direction: string; faceVisible: boolean; handsVisible: boolean }> = [
  { id: "still-life", quality: "high", strategy: "rigid_product", faceVisible: false, handsVisible: false, direction: "Premium still-life cosmetics campaign photograph of the exact supplied serum bottle, upright as one single centered hero on a warm pale stone surface. Preserve its distinctive rectangular amber glass bottle with rounded shoulders, white dropper collar and rounded white bulb, visible golden amber liquid, and blank ivory rectangular front label. Label faces camera and remains in its original position. Tactile glass refraction, realistic amber liquid, soft grounded contact shadow, controlled luxury beauty-studio highlights, warm neutral seamless background, restrained styling, sharp readable full product, no other bottles or products, no props crossing the label." },
  { id: "on-model-hand", quality: "xhigh", strategy: "rigid_product", faceVisible: true, handsVisible: true, direction: "Premium photorealistic cosmetics campaign close portrait of an adult woman applying one small drop of serum from the exact supplied bottle to her cheek. Preserve the same distinctive rectangular amber glass bottle with rounded shoulders, white cylindrical dropper collar, rounded white pipette bulb, visible golden amber liquid and blank ivory rectangular front label in the same positions and proportions. One natural hand holds the bottle upright beside her face; the other hand holds the dropper near the cheek with a tiny believable serum droplet making light skin contact. Keep bottle large, label facing camera and completely unobstructed; show realistic five-finger anatomy, natural joints, believable grip and contact, subtle pores and skin texture, natural face anatomy and restrained editorial retouching. Warm premium beauty campaign lighting, shallow depth of field with bottle and face readable. Only one product bottle and one dropper; do not duplicate packaging or invent text." },
];
await mkdir(outputDir, { recursive: true });
const summary: Record<string, unknown> = { executionPolicy: { preparationStages: [], generationPath: ["source_product", "direct_sunburst_generation", "validator", "optional_single_targeted_repair"], maximumRepairs: 1, model: process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2.5-sunburst", repairEligibilityPolicy: "severe package geometry/cap/component/label drift or severe anatomy/contact only" }, scenarios: [] };
for (const testCase of cases) {
  const executionPolicy = resolveGenerationExecutionPolicy({ ...policyInputs, productProfile: { ...profile, visibleBranding: { ...profile.visibleBranding, hasReadableText: false } }, strategy: testCase.strategy });
  const sceneSuitability = resolveSceneSuitability({ productProfile: profile, strategy: testCase.strategy, userPrompt: testCase.direction, vertical: "cosmetics" });
  const composition = resolveComposition({ productProfile: profile, sceneFamily: sceneSuitability?.selectedSceneFamily, strategy: testCase.strategy, userPrompt: testCase.direction });
  const humanRealism = resolveHumanRealismPolicy({ strategy: testCase.strategy, vertical: "cosmetics", visibleHuman: testCase.faceVisible || testCase.handsVisible, faceVisible: testCase.faceVisible, handsVisible: testCase.handsVisible });
  const prompt = buildImageGenerationPrompt(testCase.direction, "reference_edit", { strategy: testCase.strategy, useCase: "cosmetics", productProfile: profile, sceneSuitability, composition, identityManifest: manifest, visibleHuman: testCase.faceVisible || testCase.handsVisible, faceVisible: testCase.faceVisible, handsVisible: testCase.handsVisible });
  const scenario: Record<string, unknown> = { id: testCase.id, requestedQuality: testCase.quality, policyQuality: executionPolicy.quality, appliedQuality: testCase.quality, generationCalls: 0, repairCount: 0, strategy: testCase.strategy, scene: sceneSuitability?.selectedSceneFamily, humanRealism: humanRealism.applied ? humanRealism.focusAreas : [], validatorStatus: "pending", latencyMs: null };
  const started = performance.now();
  let generated;
  try {
    scenario.generationCalls = 1;
    generated = await provider.generate({ generationId: `benchmark-${testCase.id}`, projectId: "cosmetics-benchmark", sourceAsset: asset, prompt, provider: "openai", model: process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2.5-sunburst", quality: testCase.quality, aspectRatio: testCase.id === "still-life" ? "1:1" : "4:5", operation: "edit" });
  } catch (error) {
    scenario.latencyMs = Math.round(performance.now() - started);
    const cause = error instanceof Error && error.cause instanceof Error ? error.cause as Error & { status?: number; code?: string; error?: { code?: string; type?: string } } : null;
    scenario.error = error instanceof Error ? `${error.name}: ${error.message}` : "generation error";
    if (cause) scenario.providerError = { name: cause.name, status: cause.status ?? null, code: cause.code ?? cause.error?.code ?? null, type: cause.error?.type ?? null, network: cause instanceof APIError ? null : cause.name };
    (summary.scenarios as unknown[]).push(scenario);
    continue;
  }
  await writeFile(path.join(outputDir, `${testCase.id}.png`), generated.imageData);
  const validation = await validateGeneratedImageBestEffort({ originalProduct: source, generatedImage: generated.imageData, originalMimeType: "image/webp", generatedMimeType: "image/png", productProfile: profile, vertical: "cosmetics", strategy: testCase.strategy, humanRealism, sceneSuitability, composition, creativeCompliance: null, identityManifest: manifest });
  scenario.validatorStatus = validation.status;
  scenario.validatorSummary = validation.summary;
  scenario.issues = validation.issues.map(({ code, category, severity, finding }) => ({ code, category, severity, finding }));
  if (validation.status !== "validation_unavailable") {
    const allowedIssue = (issue: FidelityValidationResult["issues"][number]) => {
      const code = issue.code.toLowerCase();
      const material = issue.severity === "critical" || issue.severity === "major";
      const packageFailure = issue.category === "product_identity" || issue.category === "geometry" || ["package_geometry_changed", "branding_corrupted", "structural_drift", "critical_component_missing", "different_product", "product_identity_drift"].includes(code);
      const humanFailure = testCase.id === "on-model-hand" && (issue.category === "human_realism" || issue.category === "body_interaction" || ["hand_anatomy_error", "finger_count_error", "finger_geometry_error", "human_product_contact_error", "body_interaction_failure", "facial_realism_drift"].includes(code));
      return material && (packageFailure || humanFailure);
    };
    const targetedIssues = validation.issues.filter(allowedIssue);
    const targetedValidation = { ...validation, status: targetedIssues.length ? "fail" as const : validation.status, issues: targetedIssues, retryRecommended: targetedIssues.length > 0 };
    const eligibility = resolveRepairEligibility({ validation: targetedValidation, exactProduct: true, hybridProjectionApplied: false, maximumAttemptsRemaining: true });
    scenario.repairEligibility = eligibility;
    if (eligibility.eligible) {
      const plan = resolveRepairPlan(targetedValidation);
      if (plan.shouldRetry) {
        scenario.generationCalls = 2;
        const repair = await provider.generate({ generationId: `benchmark-${testCase.id}-repair`, projectId: "cosmetics-benchmark", sourceAsset: asset, prompt: compileRepairInstructions(prompt, plan), provider: "openai", model: process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2.5-sunburst", quality: "xhigh", aspectRatio: testCase.id === "still-life" ? "1:1" : "4:5", operation: "edit" });
        scenario.repairCount = 1;
        const repairValidation = await validateGeneratedImageBestEffort({ originalProduct: source, generatedImage: repair.imageData, originalMimeType: "image/webp", generatedMimeType: "image/png", productProfile: profile, vertical: "cosmetics", strategy: testCase.strategy, humanRealism, sceneSuitability, composition, creativeCompliance: null, identityManifest: manifest });
        scenario.repairValidatorStatus = repairValidation.status;
        scenario.repairIssues = repairValidation.issues.map(({ code, category, severity, finding }) => ({ code, category, severity, finding }));
        await writeFile(path.join(outputDir, `${testCase.id}-repair.png`), repair.imageData);
      }
    }
  }
  scenario.latencyMs = Math.round(performance.now() - started);
  (summary.scenarios as unknown[]).push(scenario);
}
await writeFile(path.join(outputDir, "summary.json"), JSON.stringify(summary, null, 2));
process.stdout.write(JSON.stringify({ outputDir, ...summary }, null, 2));
}

main().catch((error: unknown) => {
  process.stderr.write(error instanceof Error ? `${error.stack ?? error.message}\n` : "benchmark failed\n");
  process.exitCode = 1;
});
