import type { ReferenceAnalysisImage } from "./reference-analysis-core";

export function createReferenceAnalysisInput(images: ReferenceAnalysisImage[]) {
  return [{
    role: "user" as const,
    content: [
      { type: "input_text" as const, text: "Create one combined original photographic visual-direction brief from these reference images." },
      ...images.map((image) => ({
        type: "input_image" as const,
        image_url: `data:${image.mimeType};base64,${image.data.toString("base64")}`,
        detail: "low" as const,
      })),
    ],
  }];
}
