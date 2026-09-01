import type { AspectRatio } from "./types";

export type GenerationOutputCanvas = {
  height: number;
  width: number;
};

const outputCanvases: Record<AspectRatio, GenerationOutputCanvas> = {
  "1:1": { width: 1024, height: 1024 },
  "4:5": { width: 1024, height: 1280 },
  "3:4": { width: 1152, height: 1536 },
  "16:9": { width: 1536, height: 864 },
  "9:16": { width: 864, height: 1536 },
};

export function resolveImageGenerationOutputCanvas(
  aspectRatio: AspectRatio,
): GenerationOutputCanvas {
  return outputCanvases[aspectRatio];
}
