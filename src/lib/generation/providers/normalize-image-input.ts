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

function mimeTypeForFormat(format: "jpeg" | "png" | "webp"): NormalizedImageInput["mimeType"] {
  return format === "jpeg" ? "image/jpeg" : `image/${format}`;
}

async function readImageMetadata(source: Buffer) {
  try {
    const metadata = await sharp(source, { failOn: "none" }).metadata();
    if (!metadata.format) throw new ImageInputDecodeError();
    return metadata;
  } catch (error) {
    if (error instanceof ImageInputDecodeError) throw error;
    throw new ImageInputDecodeError();
  }
}

/** Validates actual image bytes rather than trusting upload MIME metadata. */
export async function assertImageInputDecodable(data: ImageInputData): Promise<void> {
  const source = Buffer.isBuffer(data) ? data : Buffer.from(await data.arrayBuffer());
  await readImageMetadata(source);
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
    png = await sharp(source, { failOn: "none" }).rotate().png().toBuffer();
  } catch {
    throw new ImageInputDecodeError();
  }
  if (png.length === 0) {
    throw new Error(`Unable to normalize image input (${fallbackMimeType || "unknown"}).`);
  }

  return { data: png, mimeType: "image/png" };
}
