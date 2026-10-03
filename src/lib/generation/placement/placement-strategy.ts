import type { ProductIdentityManifest } from "@/lib/product-identity/types";
import type { GenerationStrategy } from "../strategy/generation-strategy";

export const placementStrategies = ["single_pass", "two_stage_identity_placement"] as const;
export type PlacementStrategy = (typeof placementStrategies)[number];

export type PlacementStrategyInput = {
  vertical?: string | null;
  generationStrategy: GenerationStrategy;
  sceneFamily?: string | null;
  identityManifest: ProductIdentityManifest;
  interactionTarget?: string | null;
  referenceMode?: string | null;
  sourceFidelityRisk?: "low" | "medium" | "high" | null;
};

/** Identity-sensitive worn products need a scene before their source is edited in. */
export function resolvePlacementStrategy(input: PlacementStrategyInput): PlacementStrategy {
  const onBodyStrategy = input.generationStrategy === "jewelry_on_model"
    || input.generationStrategy === "watch_on_wrist"
    || input.generationStrategy === "footwear_on_model";
  const supportedVertical = input.vertical === "jewelry" || input.vertical === "watches" || input.vertical === "footwear";
  const supportedTarget = input.interactionTarget === "finger" || input.interactionTarget === "wrist" || input.interactionTarget === "foot";

  return onBodyStrategy && supportedVertical && supportedTarget
    ? "two_stage_identity_placement"
    : "single_pass";
}
