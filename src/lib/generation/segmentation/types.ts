export type SegmentationOperatingResolution = "1024x1024" | "2048x2048";

export type ProductSegmentationRequest = {
  image: Blob;
  mimeType: string;
  operatingResolution: SegmentationOperatingResolution;
};

export type ProductSegmentationResult = {
  mask: Buffer;
  mimeType: "image/png";
  model: string;
  provider: "fal";
  requestId: string;
};

export interface ProductSegmentationProvider {
  createMask(request: ProductSegmentationRequest): Promise<ProductSegmentationResult>;
}

export function resolveSegmentationOperatingResolution(
  width: number,
  height: number,
): SegmentationOperatingResolution {
  return Math.max(width, height) <= 1500 ? "1024x1024" : "2048x2048";
}
