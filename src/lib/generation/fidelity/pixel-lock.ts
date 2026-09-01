import sharp from "sharp";

import type {
  FidelityVerificationResult,
  PreparedPixelLockInput,
  ProductMask,
  ProductPlacement,
} from "./types";
import { resolveProductPlacement } from "./product-placement";

const maxSourcePixels = 24_000_000;
const interiorAlphaThreshold = 250;
const channelTolerance = 2;

type RawImage = {
  channels: number;
  data: Buffer;
  height: number;
  width: number;
};

async function readRawImage(input: Buffer): Promise<RawImage> {
  const { data, info } = await sharp(input, { limitInputPixels: maxSourcePixels })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return { data, width: info.width, height: info.height, channels: info.channels };
}

async function readMaskAlpha(input: Buffer): Promise<{
  data: Buffer;
  height: number;
  width: number;
}> {
  const { data, info } = await sharp(input, { limitInputPixels: maxSourcePixels })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return { data, width: info.width, height: info.height };
}

function assertCanvasDimensions(width: number, height: number) {
  if (width * height > maxSourcePixels) {
    throw new Error("Image dimensions exceed the product fidelity processing limit.");
  }
}

export async function resolveAlphaChannelProductMask(
  productImage: Buffer,
): Promise<ProductMask | null> {
  const rawImage = await readRawImage(productImage);
  assertCanvasDimensions(rawImage.width, rawImage.height);

  const alpha = Buffer.alloc(rawImage.width * rawImage.height);
  let hasTransparentPixel = false;
  let hasVisiblePixel = false;

  for (let pixelIndex = 0; pixelIndex < alpha.length; pixelIndex += 1) {
    const value = rawImage.data[pixelIndex * rawImage.channels + 3];
    alpha[pixelIndex] = value;
    hasTransparentPixel ||= value < 255;
    hasVisiblePixel ||= value > 0;
  }

  if (!hasTransparentPixel || !hasVisiblePixel) {
    return null;
  }

  return {
    data: await sharp(alpha, {
      raw: { width: rawImage.width, height: rawImage.height, channels: 1 },
    })
      .png()
      .toBuffer(),
    mimeType: "image/png",
    width: rawImage.width,
    height: rawImage.height,
    source: "alpha_channel",
  };
}

async function normalizeToCanvas(
  input: Buffer,
  placement: ProductPlacement,
  targetWidth: number,
  targetHeight: number,
): Promise<Buffer> {
  const resized = await sharp(input, { limitInputPixels: maxSourcePixels })
    .resize({ width: placement.width, height: placement.height, fit: "fill" })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: targetWidth,
      height: targetHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, left: placement.left, top: placement.top }])
    .png()
    .toBuffer();
}

async function normalizeMaskToCanvas(
  input: Buffer,
  placement: ProductPlacement,
  targetWidth: number,
  targetHeight: number,
): Promise<Buffer> {
  const resized = await sharp(input, { limitInputPixels: maxSourcePixels })
    .greyscale()
    .resize({ width: placement.width, height: placement.height, fit: "fill" })
    .png()
    .toBuffer();

  return sharp(Buffer.alloc(targetWidth * targetHeight), {
    raw: { width: targetWidth, height: targetHeight, channels: 1 },
  })
    .composite([{ input: resized, left: placement.left, top: placement.top }])
    .png()
    .toBuffer();
}

export async function preparePixelLockInput({
  mask: suppliedMask,
  originalProduct,
  targetHeight,
  targetWidth,
}: {
  mask?: ProductMask;
  originalProduct: Buffer;
  targetHeight: number;
  targetWidth: number;
}): Promise<PreparedPixelLockInput | null> {
  assertCanvasDimensions(targetWidth, targetHeight);
  const metadata = await sharp(originalProduct, { limitInputPixels: maxSourcePixels }).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to read product image dimensions.");
  }

  const mask = suppliedMask ?? (await resolveAlphaChannelProductMask(originalProduct));
  if (!mask) {
    return null;
  }

  const placement = resolveProductPlacement(
    metadata.width,
    metadata.height,
    targetWidth,
    targetHeight,
  );
  const [productCanvas, normalizedMask] = await Promise.all([
    normalizeToCanvas(originalProduct, placement, targetWidth, targetHeight),
    normalizeMaskToCanvas(mask.data, placement, targetWidth, targetHeight),
  ]);

  return {
    productCanvas,
    mask: {
      ...mask,
      data: normalizedMask,
      width: targetWidth,
      height: targetHeight,
    },
    placement,
    targetWidth,
    targetHeight,
  };
}

export async function compositeLockedProduct({
  generatedImage,
  preparedInput,
}: {
  generatedImage: Buffer;
  preparedInput: PreparedPixelLockInput;
}): Promise<Buffer> {
  const metadata = await sharp(generatedImage, { limitInputPixels: maxSourcePixels }).metadata();
  if (
    metadata.width !== preparedInput.targetWidth ||
    metadata.height !== preparedInput.targetHeight
  ) {
    throw new Error("Generated image dimensions do not match the prepared product canvas.");
  }

  return sharp(generatedImage, { limitInputPixels: maxSourcePixels })
    .composite([{ input: preparedInput.productCanvas, left: 0, top: 0 }])
    .png()
    .toBuffer();
}

export async function verifyLockedProduct({
  expectedProductCanvas,
  finalImage,
  mask,
}: {
  expectedProductCanvas: Buffer;
  finalImage: Buffer;
  mask: ProductMask;
}): Promise<FidelityVerificationResult> {
  const [expected, actual, rawMask] = await Promise.all([
    readRawImage(expectedProductCanvas),
    readRawImage(finalImage),
    readMaskAlpha(mask.data),
  ]);
  if (
    expected.width !== actual.width ||
    expected.height !== actual.height ||
    expected.width !== rawMask.width ||
    expected.height !== rawMask.height
  ) {
    throw new Error("Product fidelity verification images have incompatible dimensions.");
  }

  let checkedPixelCount = 0;
  let matchingPixelCount = 0;
  for (let pixelIndex = 0; pixelIndex < expected.width * expected.height; pixelIndex += 1) {
    if (rawMask.data[pixelIndex] < interiorAlphaThreshold) {
      continue;
    }

    checkedPixelCount += 1;
    const expectedOffset = pixelIndex * expected.channels;
    const actualOffset = pixelIndex * actual.channels;
    const matches = [0, 1, 2, 3].every(
      (channel) =>
        Math.abs(expected.data[expectedOffset + channel] - actual.data[actualOffset + channel]) <=
        channelTolerance,
    );
    if (matches) {
      matchingPixelCount += 1;
    }
  }

  if (checkedPixelCount === 0) {
    throw new Error("Product mask has no opaque pixels to verify.");
  }

  return { checkedPixelCount, score: matchingPixelCount / checkedPixelCount };
}
