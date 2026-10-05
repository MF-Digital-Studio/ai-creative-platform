import type { AspectRatio, GenerationAspectRatio } from "./types";

export type GenerationOutputCanvas = {
  height: number;
  width: number;
};

const outputCanvases: Record<AspectRatio, GenerationOutputCanvas> = {
  "16:9": { width: 1536, height: 864 },
  "9:16": { width: 864, height: 1536 },
  "1:1": { width: 1024, height: 1024 },
  "4:3": { width: 1536, height: 1152 },
  "3:4": { width: 1152, height: 1536 },
  "21:9": { width: 2688, height: 1152 },
  "4:5": { width: 1024, height: 1280 },
};

export function resolveProviderImageSize(model: string, aspectRatio: GenerationAspectRatio): GenerationOutputCanvas & { providerValue: string } {
  if (!["gpt-image-2.5-sunburst", "gpt-image-2.5-flare", "gpt-image-2"].some((supported) => model === supported || model.startsWith(`${supported}-`))) {
    throw new Error(`Image model ${model} does not support requested format ${aspectRatio}.`);
  }
  const { width, height } = outputCanvases[aspectRatio];
  return { width, height, providerValue: `${width}x${height}` };
}

export function resolveImageGenerationOutputCanvas(
  aspectRatio: AspectRatio,
): GenerationOutputCanvas {
  return outputCanvases[aspectRatio];
}

export function resolveAspectRatioForGeneration(value: unknown): GenerationAspectRatio | null {
  return value === "16:9" || value === "9:16" || value === "1:1" || value === "4:3" || value === "3:4" || value === "21:9"
    ? value
    : null;
}
