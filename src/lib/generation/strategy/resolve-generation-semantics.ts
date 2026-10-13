import type { GenerationStrategy } from "./generation-strategy";
import type { SupportedVertical } from "@/lib/verticals/supported-verticals";

export type GenerationSemantics = {
  expectsHuman: boolean;
  isWearableOnHuman: boolean;
  isProductOnly: boolean;
  requiresApparelFit: boolean;
  requiresHumanRealism: boolean;
  requiresCommercialFashionSafety: boolean;
};

const humanStrategies = new Set<GenerationStrategy>([
  "fashion_on_model", "jewelry_on_model", "watch_on_wrist", "footwear_on_model", "bags_on_model",
]);
const productOnlyModes = new Set(["ghost_mannequin", "floating", "flat_lay", "hanger", "product_hero", "pedestal", "still_life"]);
const humanInteractions = new Set(["held", "worn", "near_face", "walking", "shoulder_carry", "crossbody", "neck", "wrist", "hand"]);

/** Resolves scene meaning once; strategy expresses preservation/routing, not human-scene eligibility. */
export function resolveGenerationSemantics(input: {
  vertical: SupportedVertical | null;
  strategy: GenerationStrategy;
  visibleHuman?: boolean;
  referenceHumanPresent?: boolean;
  presetHumanPresence?: "none" | "partial" | "full" | null;
  presentationMode?: string | null;
  interactionMode?: string | null;
  strictProductOnly?: boolean;
}): GenerationSemantics {
  const mode = input.presentationMode?.trim().toLowerCase().replace(/[\s-]+/g, "_") ?? null;
  const isProductOnly = input.strictProductOnly === true || input.presetHumanPresence === "none" || Boolean(mode && productOnlyModes.has(mode));
  const interactionImpliesHuman = humanInteractions.has(input.interactionMode?.toLowerCase() ?? "");
  const expectsHuman = !isProductOnly && (humanStrategies.has(input.strategy) || input.visibleHuman === true || input.referenceHumanPresent === true || input.presetHumanPresence === "partial" || input.presetHumanPresence === "full" || interactionImpliesHuman);
  const isWearableOnHuman = input.vertical === "apparel" && expectsHuman && !isProductOnly;
  return {
    expectsHuman,
    isWearableOnHuman,
    isProductOnly,
    requiresApparelFit: isWearableOnHuman,
    requiresHumanRealism: expectsHuman,
    requiresCommercialFashionSafety: isWearableOnHuman,
  };
}
