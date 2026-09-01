export type ProductMaskSource = "alpha_channel" | "asset";

export type ProductMask = {
  data: Buffer;
  height: number;
  mimeType: "image/png";
  source: ProductMaskSource;
  width: number;
};

export type ProductPlacement = {
  height: number;
  left: number;
  top: number;
  width: number;
};

export type PreparedPixelLockInput = {
  mask: ProductMask;
  placement: ProductPlacement;
  productCanvas: Buffer;
  targetHeight: number;
  targetWidth: number;
};

export type FidelityVerificationResult = {
  checkedPixelCount: number;
  score: number;
};
