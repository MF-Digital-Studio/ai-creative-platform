export const APPAREL_PROJECTION_VERSION = "hybrid-apparel-projection-v1";

export type Box = { x: number; y: number; width: number; height: number };
export type ApparelArtworkLayer = {
  rgbaImage: Buffer;
  alphaMask: Buffer;
  sourceBounds: Box;
  confidence: number;
  extractionMode: "alpha_from_contrast" | "segmentation" | "chroma_garment_color_separation" | "unavailable";
};
export type GarmentSurface = {
  normalizedBoundingBox: Box;
  mask: Buffer | null;
  orientation: "frontal" | "three_quarter" | "unknown";
  side: "front" | "back" | "unknown";
  confidence: number;
  occluded: boolean;
};
export type GarmentLandmarks = {
  collarCenter: { x: number; y: number };
  leftShoulderSeam: { x: number; y: number };
  rightShoulderSeam: { x: number; y: number };
  leftTorsoEdge: { x: number; y: number };
  rightTorsoEdge: { x: number; y: number };
  lowerGarmentCenter: { x: number; y: number };
  printSafeRectangle: Box;
};
export type ProjectionMetadata = {
  version: typeof APPAREL_PROJECTION_VERSION;
  enabled: boolean;
  applied: boolean;
  fallbackReason: string | null;
  artworkExtractionMode: ApparelArtworkLayer["extractionMode"];
  garmentSurfaceConfidence: number;
  warpMode: "affine" | "unavailable";
  finishingPassApplied: boolean;
  validationStatus: "pass" | "fail" | "unavailable" | "not_applied";
  repairAttempted: boolean;
};

export function resolveProjectionAppliedState(input: { enabled: boolean; compositeSucceeded: boolean }): boolean {
  return input.enabled && input.compositeSucceeded;
}

export function validBox(box: Box | null | undefined): box is Box {
  return Boolean(box && [box.x, box.y, box.width, box.height].every(Number.isFinite) && box.x >= 0 && box.y >= 0 && box.width > 0 && box.height > 0 && box.x + box.width <= 1 && box.y + box.height <= 1);
}
