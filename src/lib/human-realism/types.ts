import type { GenerationStrategy } from "@/lib/generation/strategy/generation-strategy";
import type { SupportedVertical } from "@/lib/verticals/supported-verticals";

export type HumanFocusArea = "skin" | "face" | "hands" | "feet" | "nails" | "body" | "hair" | "contact";
export type HumanRealismContext = {
  strategy: GenerationStrategy;
  vertical: SupportedVertical | null;
  visibleHuman?: boolean;
  faceVisible?: boolean;
  handsVisible?: boolean;
  feetVisible?: boolean;
  presentationMode?: string | null;
  presetHumanPresence?: "none" | "partial" | "full" | null;
  referenceHumanPresent?: boolean;
  interactionMode?: string | null;
};
export type HumanRealismPolicy = { version: "human-realism-v2"; expected: boolean; applied: boolean; focusAreas: HumanFocusArea[] };
