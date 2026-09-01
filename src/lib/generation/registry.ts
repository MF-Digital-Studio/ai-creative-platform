import "server-only";

import { OpenAIImageProvider } from "./providers/openai-image-provider";
import type { GenerationProvider, ImageGenerationProviderClient } from "./types";

const openAIImageProvider = new OpenAIImageProvider();

export function getImageGenerationProvider(
  provider: GenerationProvider,
): ImageGenerationProviderClient {
  switch (provider) {
    case "openai":
      return openAIImageProvider;
  }
}
