export type GenerationProvider = "openai";

export type ImageGenerationQuality = "preview" | "standard" | "high";

export type AspectRatio = "1:1" | "4:5" | "3:4" | "16:9" | "9:16";

export type ProductPreservationMode = "reference_edit" | "pixel_lock";

export type FidelityStatus = "not_checked" | "locked" | "failed" | "not_available";

export type ImageGenerationSourceAsset = {
  id: string;
  bucketId: string;
  objectPath: string;
  data: Blob | Buffer;
  mimeType: string;
};

export type ImageGenerationRequest = {
  generationId: string;
  projectId: string;
  sourceAsset: ImageGenerationSourceAsset;
  prompt: string;
  provider: GenerationProvider;
  model: string;
  quality: ImageGenerationQuality;
  aspectRatio: AspectRatio;
};

export type ImageGenerationUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type ImageGenerationResult = {
  imageData: Buffer;
  mimeType: string;
  provider: GenerationProvider;
  model: string;
  width?: number;
  height?: number;
  providerMetadata?: Record<string, string | number | boolean | null>;
  usage?: ImageGenerationUsage;
};

export interface ImageGenerationProviderClient {
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
}

export class GenerationProviderError extends Error {
  readonly provider: GenerationProvider;

  constructor(message: string, provider: GenerationProvider, options?: ErrorOptions) {
    super(message, options);
    this.name = "GenerationProviderError";
    this.provider = provider;
  }
}
