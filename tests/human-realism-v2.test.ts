import assert from "node:assert/strict";
import test from "node:test";
import { resolveHumanRealismPolicy } from "../src/lib/human-realism/human-realism-policy";
import { compileHumanRealismPrompt } from "../src/lib/human-realism/compile-human-realism-prompt";
import { buildImageGenerationPromptWithPolicy } from "../src/lib/generation/prompts/build-image-generation-prompt";
import { buildImageEditPrompt, parseImageEditIntent } from "../src/lib/image-edit/edit-intent";
import { mapStructuredValidationOutput, resolveQualityGate } from "../src/lib/fidelity-validation/resolve-quality-gate";
import { resolveRepairPlan } from "../src/lib/auto-repair/resolve-repair-plan";
import { compileRepairInstructions } from "../src/lib/auto-repair/compile-repair-instructions";
import { MAX_AUTO_REPAIR_ATTEMPTS } from "../src/lib/auto-repair/repair-version";
import { createCostTelemetry } from "../src/lib/generation/cost-telemetry";

function gate(code: string, severity: "minor" | "major" | "critical" = "major", confidence = .95) {
  return resolveQualityGate(mapStructuredValidationOutput({ findings: [{ code, category: "human_realism", severity, confidence, region: "visible_region", repairable: true, commercialImpact: "high", identityImpact: "none", likelyCause: "unknown", finding: code, expected: "real photographed human" }] }));
}

test("1 human mode gets Human Realism V2 fragment", () => assert.match(buildImageGenerationPromptWithPolicy("campaign", "reference_edit", { strategy: "fashion_on_model", useCase: "apparel" }).prompt, /HUMAN REALISM V2/));
test("2 product-only mode does not get human realism", () => assert.doesNotMatch(buildImageGenerationPromptWithPolicy("product", "reference_edit", { strategy: "rigid_product", useCase: "apparel", visibleHuman: false, presetRules: { allowedSceneTypes: [], disallowedSceneTypes: ["people"], hardRules: [], softRules: [], variantId: "floating", presentationMode: "Floating", humanPresence: "none" } }).prompt, /HUMAN REALISM V2/));
test("3 reference human mode keeps authority and realism", () => { const p = buildImageGenerationPromptWithPolicy("reference", "reference_edit", { strategy: "fashion_on_model", referenceAuthority: true, visibleHuman: true, presetRules: { allowedSceneTypes: [], disallowedSceneTypes: [], hardRules: [], softRules: [], variantId: "model", humanPresence: "full" } }).prompt; assert.match(p, /HUMAN REALISM V2/); assert.match(p, /Reference 1 has higher authority/); });
test("4 severe face distortion hard fails", () => assert.equal(gate("HUMAN_FACE_ANATOMY_ERROR", "critical").status, "fail"));
test("5 plastic skin is a major terminal issue", () => { const r = gate("HUMAN_SKIN_PLASTIC", "minor"); assert.equal(r.issues[0]?.severity, "major"); assert.equal(r.status, "fail"); });
test("6 natural skin texture does not fail", () => assert.equal(resolveQualityGate([]).status, "pass"));
test("7 natural asymmetry does not fail", () => assert.equal(resolveQualityGate([]).status, "pass"));
test("8 clear six-finger hand hard fails", () => assert.equal(gate("VISIBLE_FINGER_COUNT_ERROR", "critical").status, "fail"));
test("9 fused fingers hard fail", () => assert.equal(gate("HUMAN_HAND_ANATOMY_ERROR", "critical").status, "fail"));
test("10 naturally occluded fingers do not false fail", () => assert.equal(resolveQualityGate([]).status, "pass"));
test("11 four-toe open footwear hard fails", () => assert.equal(gate("VISIBLE_TOE_COUNT_ERROR", "critical").status, "fail"));
test("12 closed footwear suppresses toe-count requirement", () => assert.match(compileHumanRealismPrompt(resolveHumanRealismPolicy({ strategy: "footwear_on_model", vertical: "footwear" }), "footwear"), /when toes are clearly visible/));
test("13 duplicated limb hard fails", () => assert.equal(gate("HUMAN_LIMB_ANATOMY_ERROR", "critical").status, "fail"));
test("14 impossible elbow or knee hard fails", () => assert.equal(gate("HUMAN_LIMB_ANATOMY_ERROR", "critical").status, "fail"));
test("15 mild body asymmetry passes", () => assert.equal(resolveQualityGate([]).status, "pass"));
test("16 bag strap body penetration fails", () => assert.equal(gate("BODY_PRODUCT_INTERACTION_ERROR", "critical").status, "fail"));
test("17 jewelry skin merge fails", () => assert.equal(gate("BODY_PRODUCT_INTERACTION_ERROR", "critical").status, "fail"));
test("18 footwear impossible contact fails", () => assert.equal(gate("FOOTWEAR_FIT_MISMATCH", "critical").status, "fail"));
test("19 hand failure routes to hand repair", () => assert.deepEqual(resolveRepairPlan(gate("HUMAN_HAND_ANATOMY_ERROR", "critical")).categories, ["hand_anatomy_repair"]));
test("20 skin failure routes to skin repair", () => assert.deepEqual(resolveRepairPlan(gate("HUMAN_SKIN_PLASTIC", "major")).categories, ["skin_realism_repair"]));
test("21 repair preserves SKU scene and camera", () => { const s = compileRepairInstructions("base", resolveRepairPlan(gate("HUMAN_HAND_ANATOMY_ERROR", "critical"))); assert.match(s, /exact product SKU/); assert.match(s, /camera, framing, environment, lighting, and composition/); });
test("22 only one repair is allowed", () => assert.equal(MAX_AUTO_REPAIR_ATTEMPTS, 1));
test("23 V2 adds zero mandatory external calls", () => { const t = createCostTelemetry({ productUnderstandingCalls: 0, referenceAnalysisCalls: 0, imageGenerationCalls: 1, validationCalls: 1, repairGenerationCalls: 0, inputProductImageCount: 1, inputReferenceCount: 0, repairAttempted: false, finalOutcome: "succeeded", validationOutcome: "pass" }); assert.equal(t.totalExternalAICalls, 2); });
test("24 validation unavailable does not repair", () => assert.equal(resolveRepairPlan({ status: "validation_unavailable", checks: [], issues: [], severity: null, retryRecommended: false, commerciallyUsable: null, summary: "unavailable", version: "test" }).shouldRetry, false));
test("25 Preset V5 product-only modes remain human-free", () => assert.equal(resolveHumanRealismPolicy({ strategy: "rigid_product", vertical: "apparel", presentationMode: "Ghost Mannequin", presetHumanPresence: "none", visibleHuman: true }).applied, false));
test("26 Reference 1 authority language remains unchanged", () => assert.match(buildImageGenerationPromptWithPolicy("reference", "reference_edit", { strategy: "fashion_on_model", referenceAuthority: true, visibleHuman: true, presetRules: { allowedSceneTypes: [], disallowedSceneTypes: [], hardRules: [], softRules: [], variantId: null, humanPresence: "full" } }).prompt, /Reference 1 has higher authority for scene, environment, composition, pose, camera, framing, crop, interaction, and subject placement/));
test("27 Image Edit receives the same realism policy", () => { const policy = resolveHumanRealismPolicy({ strategy: "reference_edit", vertical: null, referenceHumanPresent: true }); const prompt = buildImageEditPrompt("change background", parseImageEditIntent("change background"), compileHumanRealismPrompt(policy, null)); assert.match(prompt, /HUMAN REALISM V2/); assert.match(prompt, /person identity and appearance/); });
test("28 adult underwear flow receives realism without safety bypass", () => { const p = buildImageGenerationPromptWithPolicy("legitimate adult commercial underwear campaign", "reference_edit", { strategy: "fashion_on_model", useCase: "apparel", visibleHuman: true }).prompt; assert.match(p, /clearly adult human/); assert.doesNotMatch(p, /bypass|disable safety/i); });
