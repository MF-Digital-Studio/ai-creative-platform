export type GenerationProvider = "openai";

export type ImageGenerationQuality = "preview" | "standard" | "low" | "medium" | "high" | "xhigh" | "max" | "auto";

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

export type GenerationImageRole =
  | "product_identity_source"
  | "apparel_artwork_identity_source"
  | "reference_base_scene"
  | "scene_reference"
  | "style_reference"
  | "mask"
  | "generated_attempt";

export type GenerationImageInput = ImageGenerationSourceAsset & {
  role: GenerationImageRole;
  order: number;
};

export type ApparelArtworkIdentitySource = {
  assetId: string;
  side: "front" | "back" | "unknown";
  source: "detected_crop" | "profile_estimate" | "unavailable";
  boundingBox: { x: number; y: number; width: number; height: number } | null;
  cropMetadata: { sourceWidth: number; sourceHeight: number; left: number; top: number; width: number; height: number } | null;
  confidence: number;
  containsText: boolean;
  identityCritical: boolean;
};

export type HumanRealismMetadata = {
  version: string;
  applied: boolean;
  focusAreas: string[];
  validationResult: "pass" | "pass_with_warnings" | "fail" | "validation_unavailable" | null;
  repairType: string | null;
};

export type ImageGenerationRequest = {
  generationId: string;
  projectId: string;
  sourceAsset: ImageGenerationSourceAsset;
  images?: readonly GenerationImageInput[];
  prompt: string;
  provider: GenerationProvider;
  model: string;
  quality: ImageGenerationQuality;
  aspectRatio: AspectRatio;
  operation?: "edit" | "scene_preparation" | "identity_placement" | "reference_product_replacement";
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
