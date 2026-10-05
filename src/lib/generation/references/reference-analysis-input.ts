import type { ReferenceAnalysisImage } from "./reference-analysis-core";

export function createReferenceAnalysisInput(images: ReferenceAnalysisImage[]) {
  return [{
    role: "user" as const,
    content: [
      { type: "input_text" as const, text: "Create one combined original photographic visual-direction brief. Reference 1 alone establishes scene, environment structure, subject pose, camera, framing, crop intent, composition, and subject placement. Extract composition and pose only from Reference 1. References 2 and 3 are supporting sources only for lighting, mood, palette, styling, atmosphere, environmental texture, and editorial treatment; never average or substitute their pose, framing, camera, or composition. Product identity is never transferable." },
      ...images.map((_, index) => ({
        type: "input_text" as const,
        text: `Reference ${index + 1}${index === 0 ? " (PRIMARY: scene/composition/pose/camera/framing authority)" : " (SUPPORTING: lighting/mood/color/styling/atmosphere only; cannot override primary composition)"}.`,
      })),
      ...images.map((image) => ({
        type: "input_image" as const,
        image_url: `data:${image.mimeType};base64,${image.data.toString("base64")}`,
        detail: "low" as const,
      })),
    ],
  }];
}
