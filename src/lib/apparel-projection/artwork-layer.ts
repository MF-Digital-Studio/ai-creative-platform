import "server-only";
import { validBox, type ApparelArtworkLayer, type Box } from "./types";

/** Border pixels estimate the local fabric. Ambiguous low-contrast prints are rejected. */
export async function extractArtworkLayer(crop: Buffer, sourceBounds: Box): Promise<ApparelArtworkLayer | null> {
  if (!validBox(sourceBounds)) return null;
  const { default: sharp } = await import("sharp");
  const { data, info } = await sharp(crop).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  if (width < 12 || height < 12 || width * height > 4_000_000) return null;
  const border: number[][] = [];
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 60))) {
    for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 60))) {
      if (x < width * .06 || x > width * .94 || y < height * .06 || y > height * .94) {
        const i = (y * width + x) * 3;
        border.push([data[i], data[i + 1], data[i + 2]]);
      }
    }
  }
  if (border.length < 8) return null;
  const base = [0, 1, 2].map((channel) => border.map((pixel) => pixel[channel]).sort((a, b) => a - b)[Math.floor(border.length / 2)]);
  const rgba = Buffer.alloc(width * height * 4);
  const alpha = Buffer.alloc(width * height);
  let opaque = 0;
  for (let pixel = 0; pixel < width * height; pixel++) {
    const i = pixel * 3;
    const distance = Math.hypot(data[i] - base[0], data[i + 1] - base[1], data[i + 2] - base[2]);
    // A high threshold avoids carrying garment texture into the print layer.
    const opacity = Math.round(255 * Math.max(0, Math.min(1, (distance - 20) / 25)));
    alpha[pixel] = opacity;
    opaque += opacity > 180 ? 1 : 0;
    rgba[pixel * 4] = data[i]; rgba[pixel * 4 + 1] = data[i + 1]; rgba[pixel * 4 + 2] = data[i + 2]; rgba[pixel * 4 + 3] = opacity;
  }
  const coverage = opaque / (width * height);
  if (coverage < .015 || coverage > .7) return null;
  return {
    rgbaImage: await sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer(),
    alphaMask: await sharp(alpha, { raw: { width, height, channels: 1 } }).png().toBuffer(),
    sourceBounds, confidence: Math.min(.9, .55 + Math.min(coverage, .25)), extractionMode: "chroma_garment_color_separation",
  };
}
