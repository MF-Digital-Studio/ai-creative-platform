import assert from "node:assert/strict";
import test from "node:test";

import { mapStructuredValidationOutput, resolveQualityGate, suppressReferenceAuthorityPresetIssues } from "../src/lib/fidelity-validation/resolve-quality-gate";
import type { FidelityValidationBrief, FidelityValidationIssue, FidelityValidationResult } from "../src/lib/fidelity-validation/types";
import { renderValidationInstructions } from "../src/lib/fidelity-validation/build-validation-brief";
import { resolveWatchWristIntegration, compileWatchWristIntegrationPrompt } from "../src/lib/watch-wrist-integration/watch-wrist-integration";
import { resolveRepairPlan } from "../src/lib/auto-repair/resolve-repair-plan";
import { compileRepairInstructions } from "../src/lib/auto-repair/compile-repair-instructions";

function issue(overrides: Partial<FidelityValidationIssue>): FidelityValidationIssue {
  return {
    code: "warning",
    category: "realism",
    severity: "minor",
    finding: "A non-blocking visual difference was observed.",
    expected: "Keep the source product visually consistent.",
    sourceAuthoritative: true,
    issueCode: overrides.code ?? "warning",
    confidence: 0.92,
    identityImpact: overrides.identityImpact ?? (overrides.severity === "critical" && overrides.category === "product_identity" ? "critical" : ["product_identity", "geometry"].includes(overrides.category ?? "") ? "major" : "none"),
    likelyCause: "unknown",
    ...overrides,
  };
}

test("critical issue fails the quality gate", () => {
  assert.equal(resolveQualityGate([issue({ code: "different_product", severity: "critical", category: "product_identity" })]).status, "fail");
});

test("watch wrist V2 activates without user prompt, excludes product-only, and retains reference wrist authority", () => {
  const automatic = resolveWatchWristIntegration({ vertical: "watches", expectsHuman: true, isProductOnly: false, onWristStrategy: true });
  assert.equal(automatic.active, true);
  assert.equal(automatic.sourceIdentityPreserved, true);
  assert.match(compileWatchWristIntegrationPrompt(automatic), /flat catalog orientation is not placement authority/i);
  assert.match(compileWatchWristIntegrationPrompt(automatic), /curve around the wrist/i);
  assert.match(compileWatchWristIntegrationPrompt(automatic), /12 marker.*left or upper-left/i);
  const productOnly = resolveWatchWristIntegration({ vertical: "watches", expectsHuman: true, isProductOnly: true, onWristStrategy: true });
  assert.equal(productOnly.active, false);
  const reference = resolveWatchWristIntegration({ vertical: "watches", expectsHuman: true, isProductOnly: false, directReference: true, referenceStyle: { poseLanguage: "angled wrist and arm", visualIntent: "photo", composition: { framing: "close", cameraAngle: "side", cameraDistance: "close", subjectPlacement: "center" }, lighting: { character: "soft", direction: "side", flashBehavior: null, ambientExposure: "even", contrast: "low" }, environment: { setting: "studio", architecturalCharacter: null, surfaceCharacter: null }, color: { palette: "neutral", grading: "natural", saturation: "low" }, texture: { grain: "none", sharpness: "high", retouching: "natural" }, depthOfField: "shallow", realismCharacter: "photo" } });
  assert.equal(reference.active, true);
  assert.equal(reference.directReference, true);
  assert.equal(reference.wristGeometryAvailable, true);
});

test("watch wrist placement resolves side and surface without using image-top for dial orientation", () => {
  const leftOuter = resolveWatchWristIntegration({ vertical: "watches", expectsHuman: true, isProductOnly: false, onWristStrategy: true, creativeDirection: "left wrist, outer wrist visible" });
  const rightInner = resolveWatchWristIntegration({ vertical: "watches", expectsHuman: true, isProductOnly: false, onWristStrategy: true, creativeDirection: "right wrist, palm-up inner wrist" });
  assert.equal(leftOuter.placementContract?.wristSide, "left");
  assert.equal(leftOuter.placementContract?.visibleWristSurface, "outer");
  assert.equal(rightInner.placementContract?.wristSide, "right");
  assert.equal(rightInner.placementContract?.visibleWristSurface, "inner");
  assert.match(leftOuter.placementContract?.dialTwelveDirection ?? "", /forearm\/elbow.*hand/i);
  assert.match(rightInner.placementContract?.crownSideConsistency ?? "", /never.*mirror/i);
});

test("watch wrist V2 high-confidence physical failures reject and repair only placement", () => {
  for (const code of ["WATCH_CASE_ROTATION_MISMATCH", "WATCH_WRIST_AXIS_MISMATCH", "WATCH_DIAL_ORIENTATION_MISMATCH", "WATCH_WRIST_SIDE_ORIENTATION_MISMATCH", "WATCH_CROWN_SIDE_INCONSISTENCY", "WATCH_CASE_POSE_ORIENTATION_MISMATCH", "WATCH_FLAT_OVERLAY_APPEARANCE", "WATCH_STRAP_NOT_WRAPPED", "WATCH_CASE_FLOATING", "WATCH_PERSPECTIVE_MISMATCH", "WATCH_CASE_DEPTH_MISSING", "WATCH_LUG_STRAP_GEOMETRY_IMPOSSIBLE", "WATCH_UNWEARABLE_FIT", "BRACELET_CASE_TRANSITION_INCONSISTENT", "BRACELET_SEGMENT_FLOATING", "CONTACT_SHADOW_TOO_WEAK", "CASE_SKIN_SEATING_UNCONVINCING"]) {
    assert.equal(resolveQualityGate([issue({ code, category: "body_interaction", severity: "minor", confidence: .92, repairable: true })]).status, "fail");
  }
  const validation = resolveQualityGate([issue({ code: "WATCH_CASE_ROTATION_MISMATCH", category: "body_interaction", severity: "minor", confidence: .92, repairable: true })]);
  const plan = resolveRepairPlan(validation);
  assert.equal(plan.shouldRetry, true);
  const repair = compileRepairInstructions("base", plan);
  assert.match(repair, /Preserve the exact source watch identity and the existing human pose, scene, framing, and lighting/);
  assert.match(repair, /Correct only the validated watch region/);
});

test("watch refinement validation keeps dial detail separate from bracelet and contact realism", () => {
  const brief = renderValidationInstructions({
    sourceAuthority: "source", referencePreservation: false, productProfile: null, sceneSuitability: null,
    composition: null, appliedRequirements: [], allowedTransformations: [], verticalChecks: [],
    vertical: "watches", strategy: "watch_on_wrist",
  });
  for (const code of ["BRACELET_CASE_TRANSITION_INCONSISTENT", "BRACELET_SEGMENT_FLOATING", "CONTACT_SHADOW_TOO_WEAK", "CASE_SKIN_SEATING_UNCONVINCING", "DIAL_DETAIL_FIDELITY_LOSS"]) assert.match(brief, new RegExp(code));
  for (const code of ["WATCH_WRIST_SIDE_ORIENTATION_MISMATCH", "WATCH_CROWN_SIDE_INCONSISTENCY", "WATCH_CASE_POSE_ORIENTATION_MISMATCH"]) assert.match(brief, new RegExp(code));

  const contact = resolveQualityGate([issue({ code: "CONTACT_SHADOW_TOO_WEAK", category: "body_interaction", severity: "minor", confidence: .92, repairable: true })]);
  assert.equal(contact.status, "fail");
  const dial = resolveQualityGate([issue({ code: "DIAL_DETAIL_FIDELITY_LOSS", category: "product_identity", severity: "major", confidence: .92, repairable: true })]);
  assert.equal(dial.issues[0]?.identityImpact, "major");
  assert.equal(dial.status, "pass_with_warnings");
});

test("watch wearability aliases receive a targeted identity-preserving repair", () => {
  const validation = resolveQualityGate([issue({ code: "WATCH_LUG_STRAP_GEOMETRY_IMPOSSIBLE", category: "body_interaction", severity: "minor", confidence: .92, repairable: true })]);
  const plan = resolveRepairPlan(validation);
  assert.equal(plan.shouldRetry, true);
  assert.ok(plan.categories.includes("watch_wrap_repair"));
  assert.match(compileRepairInstructions("base", plan), /physically possible connection/i);
});

test("high-confidence worn watch and jewelry integration failures normalize and reject", () => {
  for (const code of ["WATCH_FLAT_PRODUCT_APPEARANCE", "WATCH_BRACELET_WRAP_ERROR", "JEWELRY_DEPTH_MISSING", "EARRING_EAR_ATTACHMENT_ERROR"]) {
    const result = resolveQualityGate([issue({ code, category: "body_interaction", severity: "minor", confidence: 0.92, identityImpact: "none" })]);
    assert.equal(result.issues[0]?.code, code);
    assert.equal(result.issues[0]?.severity, "critical", code);
    assert.equal(result.status, "fail", code);
  }
});

test("on-body validation guidance is active only for worn jewelry and watches", () => {
  const base: Omit<FidelityValidationBrief, "vertical" | "strategy"> = {
    sourceAuthority: "source", referencePreservation: false, productProfile: null, sceneSuitability: null,
    composition: null, appliedRequirements: [], allowedTransformations: [], verticalChecks: [],
  };
  const watchWorn = renderValidationInstructions({ ...base, vertical: "watches", strategy: "watch_on_wrist" });
  const watchProduct = renderValidationInstructions({ ...base, vertical: "watches", strategy: "rigid_product" });
  const jewelryWorn = renderValidationInstructions({ ...base, vertical: "jewelry", strategy: "jewelry_on_model" });
  const jewelryProduct = renderValidationInstructions({ ...base, vertical: "jewelry", strategy: "jewelry_still_life" });
  assert.match(watchWorn, /WATCH_CASE_DEPTH_MISSING/);
  assert.doesNotMatch(watchProduct, /WATCH_CASE_DEPTH_MISSING/);
  assert.match(jewelryWorn, /EARRING_EAR_ATTACHMENT_ERROR/);
  assert.doesNotMatch(jewelryProduct, /EARRING_EAR_ATTACHMENT_ERROR/);
});

test("bag Studio scene mismatch is a meaningful failure and gets scene-only repair eligibility", async () => {
  const mismatch = resolveQualityGate([issue({ code: "bag_preset_scene_mismatch", category: "composition_visibility", severity: "critical", identityImpact: "none", confidence: 0.9 })]);
  assert.equal(mismatch.status, "fail");
  const { resolveRepairEligibility } = await import("../src/lib/generation/execution-policy/resolve-repair-eligibility");
  const eligibility = resolveRepairEligibility({ validation: mismatch, exactProduct: false, hybridProjectionApplied: false, maximumAttemptsRemaining: true });
  assert.equal(eligibility.eligible, true);
  assert.equal(eligibility.reason, "high_confidence_preset_scene_correction");
});

test("preset scene and interaction mismatches fail the quality gate while generic environments are major", () => {
  for (const code of ["PRESET_SCENE_MISMATCH", "PRESET_INTERACTION_MISMATCH", "PRESET_PRESENTATION_MODE_MISMATCH", "PRODUCT_ONLY_MODE_HUMAN_LEAK", "PRODUCT_ONLY_MODE_ENVIRONMENT_LEAK"]) {
    const result = resolveQualityGate([issue({ code, category: "composition_visibility", severity: "critical", identityImpact: "none", confidence: 0.92 })]);
    assert.equal(result.status, "fail", code);
  }
  const generic = resolveQualityGate([issue({ code: "PRESET_ENVIRONMENT_TOO_GENERIC", category: "composition_visibility", severity: "major", identityImpact: "none", confidence: 0.9 })]);
  assert.equal(generic.status, "fail");
  const collapse = resolveQualityGate([issue({ code: "PRESET_VARIATION_COLLAPSE", category: "composition_visibility", severity: "major", identityImpact: "none", confidence: 0.9 })]);
  assert.equal(collapse.status, "fail");
});

test("binding product-only studio validation explicitly rejects human and environment leakage", () => {
  const brief: FidelityValidationBrief = {
    vertical: "apparel", strategy: "rigid_product", sourceAuthority: "source", referencePreservation: true,
    productProfile: null, sceneSuitability: null, composition: null, appliedRequirements: [], allowedTransformations: [], verticalChecks: [],
    preset: { familyId: "apparel-studio", variantId: "fabric-motion", presentationMode: "fabric_motion", humanPresence: "none", interactionMode: "product_only", strictProductOnlyStudio: true },
  };
  const instructions = renderValidationInstructions(brief);
  assert.match(instructions, /PRODUCT_ONLY_MODE_HUMAN_LEAK/);
  assert.match(instructions, /PRODUCT_ONLY_MODE_ENVIRONMENT_LEAK/);
});

test("reference authority suppresses only preset fields explicitly overridden by the reference", () => {
  const presetIssue = issue({ code: "PRESET_SCENE_MISMATCH", category: "composition_visibility", severity: "critical", identityImpact: "none" });
  const identityIssue = issue({ code: "PRODUCT_IDENTITY_DRIFT", category: "product_identity", severity: "critical", identityImpact: "critical" });
  const filtered = suppressReferenceAuthorityPresetIssues([presetIssue, identityIssue], true, ["environment"]);
  assert.deepEqual(filtered.map(({ code }) => code), ["PRODUCT_IDENTITY_DRIFT"]);
  assert.equal(resolveQualityGate(filtered).status, "fail");
});

test("bag validator enforces human-free Studio and Aesthetic Environment families", () => {
  const baseBrief: Omit<FidelityValidationBrief, "preset"> = {
    vertical: "bags", strategy: "rigid_product", sourceAuthority: "source", referencePreservation: false,
    productProfile: null, sceneSuitability: null, composition: null, appliedRequirements: [],
    allowedTransformations: [], verticalChecks: [],
  };
  const studio = renderValidationInstructions({ ...baseBrief, preset: { familyId: "bags-studio", variantId: "white" } });
  const lifestyle = renderValidationInstructions({ ...baseBrief, preset: { familyId: "bags-lifestyle", variantId: "cafe-table" } });
  assert.match(studio, /person, hand, worn bag, body contact/i);
  assert.match(studio, /BAG_PRESET_SCENE_MISMATCH/i);
  assert.match(lifestyle, /person, hand, worn bag, body contact/i);
  assert.match(lifestyle, /BAG_PRESET_SCENE_MISMATCH/i);
  const overridden = renderValidationInstructions({ ...baseBrief, strategy: "bags_on_model", preset: { familyId: "bags-lifestyle", variantId: "cafe-table" } });
  assert.doesNotMatch(overridden, /Bag Aesthetic Environment compliance gate/i);
});

test("multiple major identity issues fail the quality gate", () => {
  const result = resolveQualityGate([
    issue({ code: "identity_changed", severity: "major", category: "product_identity" }),
    issue({ code: "geometry_drift", severity: "major", category: "geometry" }),
  ]);
  assert.equal(result.status, "fail");
  assert.equal(result.retryRecommended, true);
});

test("minor issues produce pass with warnings and clean output passes", () => {
  assert.equal(resolveQualityGate([issue({})]).status, "pass_with_warnings");
  assert.equal(resolveQualityGate([]).status, "pass");
});

test("structured findings map deterministically and preserve source authority", () => {
  const raw = { findings: [{ code: "warped_sole", category: "geometry", severity: "major", finding: "The sole is warped.", expected: "Preserve outsole geometry." }] };
  const first = resolveQualityGate(mapStructuredValidationOutput(raw));
  const second = resolveQualityGate(mapStructuredValidationOutput(raw));
  assert.deepEqual(first, second);
  assert.equal(first.issues[0]?.sourceAuthoritative, true);
});

test("vertical finding codes remain available with calibrated context", () => {
  const scenarios: Array<[string, FidelityValidationIssue["category"]]> = [
    ["changed_stone_layout", "geometry"],
    ["changed_dial_layout", "geometry"],
    ["warped_sole", "structural_integrity"],
    ["moved_artwork", "branding_text"],
    ["changed_package_geometry", "geometry"],
  ];
  for (const [code, category] of scenarios) {
    const result = resolveQualityGate([issue({ code, category, severity: "major" })]);
    assert.equal(result.issues[0]?.code, code);
    assert.equal(result.issues[0]?.severity, "major");
    assert.equal(result.issues[0]?.confidence, 0.92);
    assert.ok(result.issues[0]?.likelyCause);
  }
});

test("calibration fixtures tolerate natural changes and reject identity changes", () => {
  const fixture = (code: string, category: FidelityValidationIssue["category"], severity: FidelityValidationIssue["severity"], identityImpact: FidelityValidationIssue["identityImpact"], likelyCause: FidelityValidationIssue["likelyCause"] = "source_identity_drift") => ({
    code, issueCode: code, category, severity, finding: code, expected: "preserve source identity", confidence: 0.94, identityImpact, likelyCause, sourceAuthoritative: true,
  });
  const cases: Array<[string, FidelityValidationIssue, FidelityValidationIssue["severity"], FidelityValidationResult["status"]]> = [
    ["small branded chest logo mild shift", fixture("APPAREL_ARTWORK_PLACEMENT_DRIFT", "product_identity", "minor", "minor", "perspective"), "minor", "pass_with_warnings"],
    ["wrong logo", fixture("WRONG_LOGO", "product_identity", "minor", "critical"), "critical", "fail"],
    ["large complex hoodie typography corruption", fixture("APPAREL_ARTWORK_TEXT_DRIFT", "product_identity", "major", "critical", "typography_change"), "critical", "fail"],
    ["garment fold distortion", fixture("FABRIC_DEFORMATION", "geometry", "minor", "minor", "fabric_deformation"), "minor", "pass_with_warnings"],
    ["necklace chain fall variation", fixture("CHAIN_FALL_VARIATION", "body_interaction", "minor", "none", "body_interaction"), "minor", "pass_with_warnings"],
    ["necklace pendant geometry", fixture("PENDANT_GEOMETRY_CHANGED", "product_identity", "major", "critical", "geometry_change"), "critical", "fail"],
    ["watch wrist perspective", fixture("WRIST_ANGLE_VARIATION", "realism", "minor", "none", "perspective"), "minor", "pass_with_warnings"],
    ["watch wrong dial geometry", fixture("WATCH_DIAL_STRUCTURE_CHANGED", "product_identity", "major", "critical", "geometry_change"), "critical", "fail"],
    ["footwear flex", fixture("FOOTWEAR_FLEX", "geometry", "minor", "minor", "fabric_deformation"), "minor", "pass_with_warnings"],
    ["footwear silhouette drift", fixture("FOOTWEAR_SILHOUETTE_CHANGED", "product_identity", "major", "critical", "geometry_change"), "critical", "fail"],
    ["cosmetics reflections", fixture("COSMETICS_REFLECTION_VARIATION", "realism", "minor", "none", "lighting"), "minor", "pass_with_warnings"],
    ["cosmetics label identity", fixture("BRANDING_CORRUPTED", "product_identity", "major", "critical", "typography_change"), "critical", "fail"],
  ];
  for (const [name, input, severity, status] of cases) {
    const [mapped] = mapStructuredValidationOutput({ findings: [input] });
    const result = resolveQualityGate([mapped!]);
    assert.equal(mapped?.severity, severity, name);
    assert.equal(result.status, status, name);
    assert.equal(result.commerciallyUsable, status !== "fail", name);
  }
});

test("low-confidence mild identity variation cannot become critical", () => {
  const [mapped] = mapStructuredValidationOutput({ findings: [{ code: "APPAREL_ARTWORK_PLACEMENT_DRIFT", category: "product_identity", severity: "critical", confidence: 0.32, identityImpact: "major", likelyCause: "perspective", finding: "slight shift", expected: "source placement" }] });
  const result = resolveQualityGate([mapped!]);
  assert.equal(mapped?.severity, "minor");
  assert.equal(result.status, "pass_with_warnings");
});

test("canonical identity drift cannot be downgraded by a contradictory impact label", () => {
  const [mapped] = mapStructuredValidationOutput({ findings: [{
    code: "PRODUCT_IDENTITY_DRIFT", category: "realism", severity: "minor", confidence: .96,
    identityImpact: "none", likelyCause: "unknown", region: "product", repairable: true,
    commercialImpact: "low", finding: "different product design", expected: "source product",
  }] });
  const result = resolveQualityGate([mapped!]);
  assert.equal(mapped?.identityImpact, "critical");
  assert.equal(mapped?.severity, "critical");
  assert.equal(result.status, "fail");
  assert.equal(result.commerciallyUsable, false);
});

test("direct quality-gate input also normalizes contradictory canonical identity impact", () => {
  const result = resolveQualityGate([issue({ code: "product_identity_drift", severity: "minor", confidence: .96, identityImpact: "none" })]);
  assert.equal(result.issues[0]?.identityImpact, "critical");
  assert.equal(result.status, "fail");
});

test("human realism findings stay separate from product identity", () => {
  const result = resolveQualityGate([
    issue({ code: "hand_anatomy_error", category: "human_realism", severity: "critical", identityImpact: "none", likelyCause: "body_interaction" }),
    issue({ code: "product_identity_drift", category: "product_identity", severity: "critical", identityImpact: "critical", likelyCause: "source_identity_drift" }),
  ]);
  assert.equal(result.status, "fail");
  assert.equal(result.commerciallyUsable, false);
  assert.deepEqual(new Set(result.issues.map(({ category }) => category)), new Set(["human_realism", "product_identity"]));
});

test("creative requirement issues are warnings or failures based on explicit severity", () => {
  const warning = resolveQualityGate([issue({ code: "decorative_mood_mismatch", category: "creative_requirement", severity: "minor" })]);
  const required = resolveQualityGate([issue({ code: "required_creative_missing", category: "creative_requirement", severity: "major" })]);
  assert.equal(warning.status, "pass_with_warnings");
  assert.equal(required.retryRecommended, false);
  assert.equal(required.status, "pass_with_warnings");
});
