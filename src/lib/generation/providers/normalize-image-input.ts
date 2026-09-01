import sharp from "sharp";

type ImageInputData = Blob | Buffer;

export type NormalizedImageInput = {
  data: Buffer;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
};

const supportedFormats = new Set(["jpeg", "png", "webp"]);

function mimeTypeForFormat(format: "jpeg" | "png" | "webp"): NormalizedImageInput["mimeType"] {
  return format === "jpeg" ? "image/jpeg" : `image/${format}`;
}

export async function normalizeImageInputForOpenAI(
  data: ImageInputData,
  fallbackMimeType: string,
): Promise<NormalizedImageInput> {
  const source = Buffer.isBuffer(data) ? data : Buffer.from(await data.arrayBuffer());
  const metadata = await sharp(source, { failOn: "none" }).metadata();
  const format = metadata.format;

  if (format && supportedFormats.has(format)) {
    return {
      data: source,
      mimeType: mimeTypeForFormat(format as "jpeg" | "png" | "webp"),
    };
  }

  const png = await sharp(source, { failOn: "none" }).png().toBuffer();
  if (png.length === 0) {
    throw new Error(`Unable to normalize image input (${fallbackMimeType || "unknown"}).`);
  }

  return { data: png, mimeType: "image/png" };
}
