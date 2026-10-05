import type { ProductPreservationMode } from "../types";
import type { GenerationStrategy } from "./generation-strategy";
import type { SceneFamily } from "@/lib/scene-suitability/types";
import type { SupportedVertical } from "@/lib/verticals/supported-verticals";

export type GenerationPolicyValidation = {
  strategy: GenerationStrategy;
  sceneFamily: SceneFamily | null;
  preservationMode: ProductPreservationMode;
  normalized: boolean;
  reasons: readonly string[];
};

const onBodyStrategies = new Set<GenerationStrategy>(["jewelry_on_model", "watch_on_wrist", "footwear_on_model", "fashion_on_model", "bags_on_model"]);
const onBodyScenes = new Set<SceneFamily>(["jewelry_on_body", "watch_on_wrist", "footwear_on_foot", "bags_handheld", "bags_shoulder_carry", "bags_crossbody", "bags_under_arm"]);

/** Normalizes routing once, immediately before prompt/provider work. */
export function validateGenerationPolicy(input: {
  strategy: GenerationStrategy;
  sceneFamily?: SceneFamily | null;
  preservationMode: ProductPreservationMode;
  hasUsableMask: boolean;
  vertical?: SupportedVertical | null;
}): GenerationPolicyValidation {
  let { strategy, preservationMode } = input;
  const sceneFamily = input.sceneFamily ?? null;
  const reasons: string[] = [];

  if (input.vertical === "jewelry" && strategy === "fashion_on_model") {
    strategy = "jewelry_still_life";
    reasons.push("vertical_strategy_mismatch");
  }
  if (sceneFamily === "jewelry_on_body" && strategy !== "jewelry_on_model") {
    strategy = "jewelry_on_model";
    reasons.push("jewelry_on_body_requires_on_model_strategy");
  }
  if (sceneFamily === "watch_on_wrist" && strategy !== "watch_on_wrist") {
    strategy = "watch_on_wrist";
    reasons.push("watch_on_wrist_requires_wrist_strategy");
  }
  if (sceneFamily === "footwear_on_foot" && strategy !== "footwear_on_model") {
    strategy = "footwear_on_model";
    reasons.push("footwear_on_foot_requires_on_model_strategy");
  }
  if (["bags_handheld", "bags_shoulder_carry", "bags_crossbody", "bags_under_arm"].includes(sceneFamily ?? "") && strategy !== "bags_on_model") {
    strategy = "bags_on_model";
    reasons.push("bag_carry_scene_requires_on_model_strategy");
  }
  if (onBodyStrategies.has(strategy) || (sceneFamily !== null && onBodyScenes.has(sceneFamily))) {
    if (preservationMode !== "reference_edit") reasons.push("on_body_requires_reference_edit");
    preservationMode = "reference_edit";
  } else if (preservationMode === "pixel_lock" && !input.hasUsableMask) {
    preservationMode = "reference_edit";
    reasons.push("mask_unavailable");
  }
  return { strategy, sceneFamily, preservationMode, normalized: reasons.length > 0, reasons };
}
