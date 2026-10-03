import { getImageModelCapabilities } from "./image-model-capabilities";

export type OpenAIImageEditRequestParams<TImage> = {
  model: string;
  image: TImage;
  prompt: string;
  n: 1;
  output_format: "png";
  size: string;
  quality?: "high" | "low";
  input_fidelity?: "high";
};

/** Builds a sparse request so unsupported optional fields cannot be serialized. */
export function buildOpenAIImageEditParams<TImage>(input: {
  model: string;
  image: TImage;
  prompt: string;
  size: string;
  quality: "high" | "low" | null;
}): OpenAIImageEditRequestParams<TImage> {
  const capabilities = getImageModelCapabilities(input.model);

  return {
    model: input.model,
    image: input.image,
    prompt: input.prompt,
    n: 1,
    output_format: "png",
    size: input.size,
    ...(input.quality ? { quality: input.quality } : {}),
    ...(capabilities.supportsExplicitInputFidelity ? { input_fidelity: "high" } : {}),
  };
}
