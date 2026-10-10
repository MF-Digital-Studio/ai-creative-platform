import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { getPresetPresentationModes, getPresetVariantsForPresentationMode, presetFamilies } from "../src/lib/creative-presets/creative-presets";
import { presentationModeContracts } from "../src/lib/creative-presets/presentation-mode-contracts";
import { resolveComposition } from "../src/lib/composition-intelligence/resolve-composition";
import { resolveQualityGate } from "../src/lib/fidelity-validation/resolve-quality-gate";
import { resolveRepairPlan } from "../src/lib/auto-repair/resolve-repair-plan";
import { resolveSceneSuitability } from "../src/lib/scene-suitability/resolve-scene-suitability";
import type { FidelityValidationIssue } from "../src/lib/fidelity-validation/types";

test("every visible mode has one non-empty, non-duplicate explicit variant pool", () => {
  for (const family of presetFamilies) {
    const seenPools = new Set<string>();
    const assigned = new Set<string>();
    for (const mode of getPresetPresentationModes(family.id)) {
      const variants = getPresetVariantsForPresentationMode(family, mode.id);
      assert.ok(variants.length > 0, `${family.id}/${mode.id} is dead`);
      const pool = variants.map(({ id }) => id).sort().join("|");
      assert.ok(!seenPools.has(pool), `${family.id}/${mode.id} duplicates a visible pool`);
      seenPools.add(pool);
      for (const variant of variants) {
        assert.ok(!assigned.has(variant.id), `${variant.id} belongs to multiple visible modes`);
        assigned.add(variant.id);
        assert.equal(variant.presentationMode, mode.id);
        assert.equal(variant.cameraDistance, mode.contract.cameraDistance);
        assert.equal(variant.cameraAngle, mode.contract.cameraAngle);
        assert.equal(variant.framing, mode.contract.framing);
        assert.equal(variant.physicalSupport, mode.contract.physicalSupport);
        assert.equal(variant.gravityBehavior, mode.contract.gravityBehavior);
        assert.equal(variant.humanPresence, mode.contract.humanPresence);
        assert.equal(variant.interactionMode, mode.contract.interactionMode);
        assert.ok(variant.environmentSubtype);
        assert.ok(variant.subjectPlacement);
        assert.ok(variant.productOrientation);
        assert.ok(variant.surface);
        assert.ok(variant.propLanguage);
        assert.ok(variant.lighting);
        assert.ok(variant.captureProfile);
      }
    }
    assert.deepEqual([...assigned].sort(), family.variants.map(({ id }) => id).sort(), `${family.id} has an unassigned hidden variant`);
  }
});

test("visible modes are structurally distinct inside each family", () => {
  for (const family of presetFamilies) {
    const fingerprints = getPresetPresentationModes(family.id).map(({ contract }) => JSON.stringify({
      environment: contract.environmentGrammar,
      camera: [contract.cameraDistance, contract.cameraAngle],
      framing: [contract.framing, contract.subjectScale, contract.subjectPlacement],
      support: [contract.physicalSupport, contract.gravityBehavior],
      orientation: contract.productOrientation,
      human: [contract.humanPresence, contract.interactionMode],
      product: [contract.productCount, contract.targetDetail],
    }));
    assert.equal(new Set(fingerprints).size, fingerprints.length, `${family.id} exposes structurally duplicate modes`);
  }
});

test("hard mode invariants cannot conflict with normalized variant metadata", () => {
  for (const contract of presentationModeContracts) {
    if (contract.id.includes("macro") || contract.id === "detail" || contract.id === "hardware_macro") {
      assert.equal(contract.cameraDistance, "macro", `${contract.familyId}/${contract.id}`);
      assert.equal(contract.framing, "macro", `${contract.familyId}/${contract.id}`);
    }
    if (contract.id === "top_down" || contract.id === "flat_lay" || contract.id === "folded") assert.equal(contract.cameraAngle, "overhead");
    if (contract.id.includes("floating") || contract.id === "suspended_bag" || contract.id === "fabric_motion") assert.match(contract.physicalSupport, /unsupported|suspension/);
    if (contract.id === "pedestal") assert.match(contract.physicalSupport, /pedestal/);
    if (["crossbody", "shoulder_carry", "hand_carry"].includes(contract.id)) assert.match(contract.interactionMode, new RegExp(contract.id.replace("shoulder_carry", "shoulder").replace("hand_carry", "hand")));
    if (contract.humanPresence === "none") assert.equal(contract.interactionMode === "product_only" || contract.interactionMode === "product_pair", true);
  }
});

test("composition consumes macro and top-down contracts without generic fallback leakage", () => {
  const macro = presentationModeContracts.find(({ familyId, id }) => familyId === "bags-studio" && id === "hardware_macro")!;
  const topDown = presentationModeContracts.find(({ familyId, id }) => familyId === "footwear-studio" && id === "top_down")!;
  const macroComposition = resolveComposition({ sceneFamily: "bags_studio", strategy: "rigid_product", userPrompt: "", presetId: macro.familyId, presentationModeContract: macro })!;
  const topDownComposition = resolveComposition({ sceneFamily: "footwear_studio", strategy: "rigid_product", userPrompt: "", presetId: topDown.familyId, presentationModeContract: topDown })!;
  assert.equal(macroComposition.framing, "macro");
  assert.equal(macroComposition.cameraDistance, "macro");
  assert.equal(topDownComposition.preferredAngle, "elevated");
});

test("scene suitability binds presentation-specific interaction scenes over generic intent", () => {
  const crossbody = presentationModeContracts.find(({ familyId, id }) => familyId === "bags-on-model" && id === "crossbody")!;
  const botanical = presentationModeContracts.find(({ familyId, id }) => familyId === "cosmetics-scenic" && id === "botanical")!;
  assert.equal(resolveSceneSuitability({ vertical: "bags", strategy: "bags_on_model", userPrompt: "studio tabletop", presentationModeContract: crossbody })?.selectedSceneFamily, "bags_crossbody");
  assert.equal(resolveSceneSuitability({ vertical: "cosmetics", strategy: "rigid_product", userPrompt: "plain stone", presentationModeContract: botanical })?.selectedSceneFamily, "cosmetics_lifestyle");
});

test("mode violations hard fail and route into the existing single repair pass", () => {
  const codes = [
    "PRESET_MACRO_FRAMING_MISMATCH", "PRESET_FLOATING_SUPPORT_MISMATCH", "PRESET_TOP_DOWN_CAMERA_MISMATCH",
    "PRESET_FRONT_ORIENTATION_MISMATCH", "PRESET_PAIR_COMPOSITION_MISMATCH", "PRESET_PEDESTAL_SUPPORT_MISMATCH",
    "GHOST_MANNEQUIN_PHANTOM_BODY_ARTIFACT", "PRESET_REFLECTION_MISMATCH", "PRESET_CLINICAL_SCENE_MISMATCH",
    "PRESET_BOTANICAL_SCENE_MISMATCH", "PRESET_LIQUID_INTERACTION_MISMATCH", "BAG_CARRY_MODE_MISMATCH",
    "JEWELRY_BODY_TARGET_MISMATCH", "PRESET_PRESENTATION_MODE_MISMATCH",
  ];
  for (const code of codes) {
    const issue: FidelityValidationIssue = { code, category: "composition_visibility", severity: "critical", confidence: .95, identityImpact: "none", finding: "mode mismatch", expected: "mode contract", sourceAuthoritative: true };
    const gate = resolveQualityGate([issue]);
    assert.equal(gate.status, "fail", code);
    assert.equal(resolveRepairPlan(gate).shouldRetry, true, code);
  }
});

test("every visible mode has a unique localized description in Turkish and English", () => {
  for (const locale of ["tr", "en"] as const) {
    const messages = JSON.parse(readFileSync(resolve(process.cwd(), `src/messages/${locale}.json`), "utf8")) as { Dashboard: { presets: { presentationModes: Record<string, string>; presentationModeDescriptions: Record<string, Record<string, string>> } } };
    for (const family of presetFamilies) {
      const modes = getPresetPresentationModes(family.id);
      const labels = modes.map(({ id }) => messages.Dashboard.presets.presentationModes[id]);
      const descriptions = modes.map(({ id }) => {
        assert.ok(messages.Dashboard.presets.presentationModes[id], `${locale}/${family.id}/${id} label`);
        const description = messages.Dashboard.presets.presentationModeDescriptions[family.id]?.[id];
        assert.ok(description, `${locale}/${family.id}/${id} description`);
        return description;
      });
      assert.equal(new Set(labels).size, labels.length, `${locale}/${family.id} labels`);
      assert.equal(new Set(descriptions).size, descriptions.length, `${locale}/${family.id} descriptions`);
    }
  }
});

test("live QA manifest covers the canonical visible-mode matrix without provider calls", () => {
  const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "docs/preset-live-qa-manifest.json"), "utf8")) as { providerCallsPerformed: boolean; entries: Array<{ family: string; mode: string }> };
  assert.equal(manifest.providerCallsPerformed, false);
  assert.equal(manifest.entries.length, presentationModeContracts.length);
  assert.deepEqual(
    manifest.entries.map(({ family, mode }) => `${family}/${mode}`).sort(),
    presentationModeContracts.map(({ familyId, id }) => `${familyId}/${id}`).sort(),
  );
});

test("presentation mode assignment contains no index-based fallback", () => {
  const source = readFileSync(resolve(process.cwd(), "src/lib/creative-presets/creative-presets.ts"), "utf8");
  assert.doesNotMatch(source, /presentationModesByFamily|presentationModeGroups|cycle\(presentationModes\)|index\s*%\s*presentation/i);
});
