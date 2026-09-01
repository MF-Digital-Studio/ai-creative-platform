import "server-only";

import { createFalClient } from "@fal-ai/client";

import type { ProductSegmentationProvider, ProductSegmentationRequest, ProductSegmentationResult } from "../types";

const endpoint = "fal-ai/birefnet/v2";

export class FalBirefnetProvider implements ProductSegmentationProvider {
  async createMask(request: ProductSegmentationRequest): Promise<ProductSegmentationResult> {
    const key = process.env.FAL_KEY;
    if (!key) throw new Error("Segmentation provider is unavailable.");
    const fal = createFalClient({ credentials: key });
    const imageUrl = await fal.storage.upload(request.image, { lifecycle: { expiresIn: "1h" } });
    const response = await fal.subscribe(endpoint, {
      input: {
        image_url: imageUrl,
        model: "General Use (Light)",
        operating_resolution: request.operatingResolution,
        output_mask: true,
        refine_foreground: true,
        output_format: "png",
        mask_only: false,
      },
    });
    const data = response.data as { mask_image?: { url?: string } };
    const maskUrl = data.mask_image?.url;
    if (!maskUrl) throw new Error("Segmentation provider returned no mask.");
    const maskResponse = await fetch(maskUrl);
    if (!maskResponse.ok) throw new Error("Unable to download segmentation mask.");
    const mask = Buffer.from(await maskResponse.arrayBuffer());
    return { mask, mimeType: "image/png", provider: "fal", model: endpoint, requestId: response.requestId };
  }
}
