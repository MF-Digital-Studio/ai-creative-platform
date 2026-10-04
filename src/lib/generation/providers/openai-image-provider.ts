import "server-only";

import { toFile } from "openai";
import type { ImageEditParamsNonStreaming } from "openai/resources/images";

import { getOpenAIClient } from "@/lib/openai/client";

import { resolveImageGenerationOutputCanvas, type GenerationOutputCanvas } from "../output-canvas";
import { normalizeImageInputForOpenAI } from "./normalize-image-input";
import {
  GenerationProviderError,
  type AspectRatio,
  type ImageGenerationProviderClient,
  type ImageGenerationQuality,
  type ImageGenerationRequest,
  type ImageGenerationResult,
} from "../types";
import { orderGenerationImages } from "../image-roles";
import { buildOpenAIImageEditParams } from "./openai-image-request";

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
): "high" | "low" | "xhigh" | "max" | null {
  switch (quality) {
    case "preview":
    case "low":
      return "low";
    case "medium":
    case "high":
      return "high";
    case "xhigh":
    case "max":
      return quality;
    case "standard":
    case "auto":
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
    const operation = request.operation ?? "image_generation";
    console.info("[generation] provider_entered", {
      model: request.model,
      quality: request.quality,
      operation,
    });
    try {
      const orderedImages = request.images ? [...request.images].sort((left, right) => left.order - right.order) : orderGenerationImages(request.sourceAsset);
      const scenePreparation = request.operation === "scene_preparation";
      const referenceReplacement = request.operation === "reference_product_replacement";
      if (referenceReplacement && (orderedImages[0]?.role !== "reference_base_scene" || orderedImages[1]?.role !== "product_identity_source")) throw new GenerationProviderError("Reference replacement requires the base scene first and product identity source second.", "openai");
      if (!scenePreparation && !referenceReplacement && request.operation !== "identity_placement" && orderedImages[0]?.role !== "product_identity_source") throw new GenerationProviderError("Product identity source must be the first provider image.", "openai");
      if (request.operation !== "identity_placement" && request.prompt.includes("SOURCE ARTWORK IDENTITY — EXACT DESIGN AUTHORITY") && orderedImages[0]?.role === "product_identity_source" && orderedImages[1]?.role !== "apparel_artwork_identity_source") throw new GenerationProviderError("Exact-product apparel generation requires its separate artwork identity input when localization succeeded.", "openai");
      if (request.operation !== "identity_placement" && orderedImages.some(({ role }) => role === "apparel_artwork_identity_source") && orderedImages[referenceReplacement ? 2 : 1]?.role !== "apparel_artwork_identity_source") throw new GenerationProviderError("Apparel artwork identity source must follow the product identity source.", "openai");
      if (request.operation !== "identity_placement" && orderedImages.some(({ role }) => role === "apparel_artwork_identity_source") && orderedImages.some(({ role }) => role === "scene_reference" || role === "style_reference") && orderedImages.findIndex(({ role }) => role === "apparel_artwork_identity_source") > orderedImages.findIndex(({ role }) => role === "scene_reference" || role === "style_reference")) throw new GenerationProviderError("Apparel artwork identity must precede scene references.", "openai");
      const imageFiles = await Promise.all(orderedImages.map(async (image, index) => {
        const normalized = await normalizeImageInputForOpenAI(image.data, image.mimeType);
        const suffix = normalized.mimeType === "image/jpeg" ? "jpg" : normalized.mimeType === "image/webp" ? "webp" : "png";
        return toFile(normalized.data, `${String(index + 1).padStart(2, "0")}-${image.role}.${suffix}`, { type: normalized.mimeType });
      }));
      const size = resolveOpenAIImageSize(request.aspectRatio);
      const quality = resolveOpenAIImageQuality(request.quality);
      // The installed SDK types predate the Image 2.5 extended quality values.
      console.info("[generation] openai_request_started", {
        model: request.model,
        quality: request.quality,
        operation,
      });
      const response = scenePreparation && imageFiles.length === 0
        ? await getOpenAIClient().images.generate({
          model: request.model,
          prompt: request.prompt,
          size: size.value,
          ...(quality ? { quality: quality as "high" | "low" } : {}),
          output_format: "png",
        })
        : await getOpenAIClient().images.edit(buildOpenAIImageEditParams({
          model: request.model,
          image: imageFiles.length === 1 ? imageFiles[0] : imageFiles,
          prompt: request.prompt,
          size: size.value,
          quality,
        }) as ImageEditParamsNonStreaming);
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
        providerMetadata: { ...(requestId ? { requestId } : {}), model: request.model, quality: quality ?? "auto" },
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
