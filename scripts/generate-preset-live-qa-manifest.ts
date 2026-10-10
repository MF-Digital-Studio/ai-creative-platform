import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { presentationModeContracts } from "../src/lib/creative-presets/presentation-mode-contracts";

const criticalChecks = (id: string) => [
  id.includes("macro") || id === "detail" || id === "hardware_macro" ? "PRESET_MACRO_FRAMING_MISMATCH" : null,
  id.includes("floating") || id === "suspended_bag" || id === "fabric_motion" ? "PRESET_FLOATING_SUPPORT_MISMATCH" : null,
  id === "top_down" || id === "flat_lay" || id === "folded" ? "PRESET_TOP_DOWN_CAMERA_MISMATCH" : null,
  id === "front_hero" || id === "packshot" || id === "catalogue_product" ? "PRESET_FRONT_ORIENTATION_MISMATCH" : null,
  id === "pair_composition" ? "PRESET_PAIR_COMPOSITION_MISMATCH" : null,
  id === "pedestal" ? "PRESET_PEDESTAL_SUPPORT_MISMATCH" : null,
  id === "ghost_mannequin" ? "GHOST_MANNEQUIN_PHANTOM_BODY_ARTIFACT" : null,
  id === "reflection" || id === "mirror" || id === "reflective_surface" || id === "reflective_floor" ? "PRESET_REFLECTION_MISMATCH" : null,
  id === "clinical" ? "PRESET_CLINICAL_SCENE_MISMATCH" : null,
  id === "botanical" ? "PRESET_BOTANICAL_SCENE_MISMATCH" : null,
  id === "liquid_interaction" || id === "water" ? "PRESET_LIQUID_INTERACTION_MISMATCH" : null,
  ["crossbody", "shoulder_carry", "hand_carry"].includes(id) ? "BAG_CARRY_MODE_MISMATCH" : null,
  ["on_neck", "on_ear", "on_hand", "on_wrist"].includes(id) ? "JEWELRY_BODY_TARGET_MISMATCH" : null,
  "PRESET_PRESENTATION_MODE_MISMATCH",
].filter((value): value is string => Boolean(value));

const manifest = {
  version: "preset-live-qa-v1",
  generatedFrom: "src/lib/creative-presets/presentation-mode-contracts.ts",
  providerCallsPerformed: false,
  entries: presentationModeContracts.map((contract) => ({
    family: contract.familyId,
    mode: contract.id,
    expectedVisualBehavior: contract.required,
    forbiddenBehavior: contract.forbidden,
    suggestedSourceProductCategory: contract.vertical,
    humanExpected: contract.humanPresence !== "none",
    referenceShouldBeTested: true,
    criticalValidatorChecks: criticalChecks(contract.id),
    contract: {
      sceneTypes: contract.sceneTypes,
      environmentGrammar: contract.environmentGrammar,
      cameraDistance: contract.cameraDistance,
      cameraAngle: contract.cameraAngle,
      framing: contract.framing,
      productOrientation: contract.productOrientation,
      physicalSupport: contract.physicalSupport,
      gravityBehavior: contract.gravityBehavior,
      interactionMode: contract.interactionMode,
      productCount: contract.productCount,
      targetDetail: contract.targetDetail,
    },
  })),
};

const outputDirectory = resolve(process.cwd(), "docs");
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(resolve(outputDirectory, "preset-live-qa-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
