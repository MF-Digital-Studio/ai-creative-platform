import sharp from "sharp";

type ImageInputData = Blob | Buffer;

export class ImageInputDecodeError extends Error {
  constructor() {
    super("The uploaded image cannot be decoded. Please upload a valid JPEG, PNG, or WebP file.");
    this.name = "ImageInputDecodeError";
  }
}

export type NormalizedImageInput = {
  data: Buffer;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
};

const supportedFormats = new Set(["jpeg", "png", "webp"]);
const maxInputPixels = 24_000_000;

function mimeTypeForFormat(format: "jpeg" | "png" | "webp"): NormalizedImageInput["mimeType"] {
  return format === "jpeg" ? "image/jpeg" : `image/${format}`;
}

async function readImageMetadata(source: Buffer) {
  try {
    const metadata = await sharp(source, { failOn: "none", limitInputPixels: maxInputPixels, sequentialRead: true }).metadata();
    if (!metadata.format) throw new ImageInputDecodeError();
    return metadata;
  } catch (error) {
    if (error instanceof ImageInputDecodeError) throw error;
    throw new ImageInputDecodeError();
  }
}

/**
 * Validates actual image bytes rather than trusting upload MIME metadata.
 * Raw output forces libvips to decode every source pixel while the input-pixel
 * cap prevents an upload from allocating an unbounded decoded raster.
 */
export async function assertImageInputDecodable(data: ImageInputData): Promise<void> {
  const source = Buffer.isBuffer(data) ? data : Buffer.from(await data.arrayBuffer());
  await readImageMetadata(source);
  try {
    await sharp(source, { failOn: "warning", limitInputPixels: maxInputPixels, sequentialRead: true })
      .rotate()
      .raw()
      .toBuffer();
  } catch {
    throw new ImageInputDecodeError();
  }
}

export async function normalizeImageInputForOpenAI(
  data: ImageInputData,
  fallbackMimeType: string,
): Promise<NormalizedImageInput> {
  const source = Buffer.isBuffer(data) ? data : Buffer.from(await data.arrayBuffer());
  const metadata = await readImageMetadata(source);
  const format = metadata.format;

  if (format && supportedFormats.has(format)) {
    return {
      data: source,
      mimeType: mimeTypeForFormat(format as "jpeg" | "png" | "webp"),
    };
  }

  let png: Buffer;
  try {
    png = await sharp(source, { failOn: "none", limitInputPixels: maxInputPixels, sequentialRead: true }).rotate().png().toBuffer();
  } catch {
    throw new ImageInputDecodeError();
  }
  if (png.length === 0) {
    throw new Error(`Unable to normalize image input (${fallbackMimeType || "unknown"}).`);
  }

  return { data: png, mimeType: "image/png" };
}
