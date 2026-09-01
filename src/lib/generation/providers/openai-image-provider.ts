import "server-only";

import { toFile } from "openai";

import { getOpenAIClient } from "@/lib/openai/client";

import { resolveImageGenerationOutputCanvas, type GenerationOutputCanvas } from "../output-canvas";
import {
  GenerationProviderError,
  type AspectRatio,
  type ImageGenerationProviderClient,
  type ImageGenerationQuality,
  type ImageGenerationRequest,
  type ImageGenerationResult,
} from "../types";

const maxGeneratedImageBytes = 20 * 1024 * 1024;

type OpenAIImageSize = GenerationOutputCanvas & {
  value: string;
};

export function resolveOpenAIImageSize(aspectRatio: AspectRatio): OpenAIImageSize {
  const canvas = resolveImageGenerationOutputCanvas(aspectRatio);

  return { ...canvas, value: `${canvas.width}x${canvas.height}` };
}

export function resolveOpenAIImageQuality(
  quality: ImageGenerationQuality,
): "high" | "low" | null {
  switch (quality) {
    case "preview":
      return "low";
    case "high":
      return "high";
    case "standard":
      // Keep the established API default for the existing generation flow.
      return null;
  }
}

function getProviderRequestId(response: unknown): string | null {
  if (
    response &&
    typeof response === "object" &&
    "_request_id" in response &&
    typeof response._request_id === "string"
  ) {
    return response._request_id.slice(0, 255);
  }

  return null;
}

export class OpenAIImageProvider implements ImageGenerationProviderClient {
  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    try {
      const imageFile = await toFile(request.sourceAsset.data, "product-image", {
        type: request.sourceAsset.mimeType || "image/png",
      });
      const size = resolveOpenAIImageSize(request.aspectRatio);
      const quality = resolveOpenAIImageQuality(request.quality);
      const response = await getOpenAIClient().images.edit({
        model: request.model,
        image: imageFile,
        prompt: request.prompt,
        n: 1,
        output_format: "png",
        size: size.value,
        ...(quality ? { quality } : {}),
      });
      const imageBase64 = response.data?.[0]?.b64_json;

      if (typeof imageBase64 !== "string" || imageBase64.length === 0) {
        throw new GenerationProviderError(
          "The image provider returned no image data.",
          "openai",
        );
      }

      const imageData = Buffer.from(imageBase64, "base64");
      if (imageData.length === 0 || imageData.length > maxGeneratedImageBytes) {
        throw new GenerationProviderError("The generated image is invalid.", "openai");
      }

      const requestId = getProviderRequestId(response);
      return {
        imageData,
        mimeType: "image/png",
        provider: "openai",
        model: request.model,
        width: size.width,
        height: size.height,
        providerMetadata: requestId ? { requestId } : undefined,
      };
    } catch (error) {
      if (error instanceof GenerationProviderError) {
        throw error;
      }

      throw new GenerationProviderError("OpenAI image generation failed.", "openai", {
        cause: error,
      });
    }
  }
}
