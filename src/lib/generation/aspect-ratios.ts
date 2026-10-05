import type { GenerationAspectRatio } from "./types";

export type AspectRatioConfig = {
  value: GenerationAspectRatio;
  nameKey: string;
  descriptionKey: string;
  orientation: "landscape" | "portrait" | "square" | "cinematic";
};

export const GENERATION_ASPECT_RATIOS = [
  { value: "16:9", nameKey: "widescreen", descriptionKey: "widescreenUse", orientation: "landscape" },
  { value: "9:16", nameKey: "vertical", descriptionKey: "verticalUse", orientation: "portrait" },
  { value: "1:1", nameKey: "square", descriptionKey: "squareUse", orientation: "square" },
  { value: "4:3", nameKey: "classic", descriptionKey: "classicUse", orientation: "landscape" },
  { value: "3:4", nameKey: "tall", descriptionKey: "tallUse", orientation: "portrait" },
  { value: "21:9", nameKey: "cinemascope", descriptionKey: "cinemascopeUse", orientation: "cinematic" },
] as const satisfies readonly AspectRatioConfig[];

export const DEFAULT_GENERATION_ASPECT_RATIO: GenerationAspectRatio = "1:1";

export function isGenerationAspectRatio(value: unknown): value is GenerationAspectRatio {
  return typeof value === "string" && GENERATION_ASPECT_RATIOS.some((ratio) => ratio.value === value);
}

export function getAspectRatioNameKey(value: GenerationAspectRatio): string {
  return GENERATION_ASPECT_RATIOS.find((ratio) => ratio.value === value)!.nameKey;
}
