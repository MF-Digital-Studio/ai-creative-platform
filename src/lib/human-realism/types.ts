import type { GenerationStrategy } from "@/lib/generation/strategy/generation-strategy";
import type { SupportedVertical } from "@/lib/verticals/supported-verticals";

export type HumanFocusArea = "skin" | "face" | "hands" | "nails" | "body" | "hair" | "contact";
export type HumanRealismContext = {
  strategy: GenerationStrategy;
  vertical: SupportedVertical | null;
  visibleHuman?: boolean;
  faceVisible?: boolean;
  handsVisible?: boolean;
};
export type HumanRealismPolicy = { applied: boolean; focusAreas: HumanFocusArea[] };
