import type { ProductPlacement } from "./types";

export function resolveProductPlacement(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): ProductPlacement {
  if (
    !Number.isInteger(sourceWidth) ||
    !Number.isInteger(sourceHeight) ||
    !Number.isInteger(targetWidth) ||
    !Number.isInteger(targetHeight) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    targetWidth <= 0 ||
    targetHeight <= 0
  ) {
    throw new Error("Product placement requires positive image dimensions.");
  }

  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const width = Math.max(1, Math.min(targetWidth, Math.round(sourceWidth * scale)));
  const height = Math.max(1, Math.min(targetHeight, Math.round(sourceHeight * scale)));

  return {
    width,
    height,
    left: Math.floor((targetWidth - width) / 2),
    top: Math.floor((targetHeight - height) / 2),
  };
}
