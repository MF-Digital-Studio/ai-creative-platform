import type { ReferenceAnalysisImage } from "./reference-analysis-core";

export function createReferenceAnalysisInput(images: ReferenceAnalysisImage[]) {
  return [{
    role: "user" as const,
    content: [
      { type: "input_text" as const, text: "Create one combined original photographic visual-direction brief. Reference 1 is the primary composition source; Reference 2 may refine lighting/environment; Reference 3 may refine texture/mood. Product identity is never transferable." },
      ...images.map((_, index) => ({
        type: "input_text" as const,
        text: `Reference ${index + 1}${index === 0 ? " (primary composition)" : index === 1 ? " (secondary lighting/environment)" : " (optional texture/mood)"}.`,
      })),
      ...images.map((image) => ({
        type: "input_image" as const,
        image_url: `data:${image.mimeType};base64,${image.data.toString("base64")}`,
        detail: "low" as const,
      })),
    ],
  }];
}
