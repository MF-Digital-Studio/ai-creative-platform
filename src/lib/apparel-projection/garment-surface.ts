import "server-only";
import { validBox, type Box, type GarmentLandmarks, type GarmentSurface } from "./types";

const boxSchema = { type: "object", additionalProperties: false, required: ["x", "y", "width", "height"], properties: { x: { type: "number" }, y: { type: "number" }, width: { type: "number" }, height: { type: "number" } } } as const;
const schema = { type: "object", additionalProperties: false, required: ["box", "side", "orientation", "confidence", "occluded"], properties: { box: { ...boxSchema, type: ["object", "null"] }, side: { type: "string", enum: ["front", "back", "unknown"] }, orientation: { type: "string", enum: ["frontal", "three_quarter", "unknown"] }, confidence: { type: "number" }, occluded: { type: "boolean" } } } as const;

export async function detectGarmentSurface(image: Buffer, side: "front" | "back"): Promise<GarmentSurface | null> {
  try {
    const { default: sharp } = await import("sharp");
    const normalizedImage = await sharp(image, { limitInputPixels: 50_000_000 }).resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true }).png().toBuffer();
    const { getOpenAIClient } = await import("@/lib/openai/client");
    const { structuredResponseText } = await import("@/lib/openai/structured-response");
    const { getReferenceAnalysisModel } = await import("@/lib/generation/references/reference-analysis");
    const response = await getOpenAIClient().responses.create({
      model: getReferenceAnalysisModel(), store: false, max_output_tokens: 240,
      instructions: `Locate the single visible ${side} torso garment panel, excluding sleeves, arms and outerwear. Return its normalized bounding rectangle, side, orientation, confidence, and whether any foreground object covers the central print area. Return null box when uncertain, side mismatch, multiple garments, or heavy folds.`,
      input: [{ role: "user", content: [{ type: "input_image", image_url: `data:image/png;base64,${normalizedImage.toString("base64")}`, detail: "high" }] }],
      text: structuredResponseText({ type: "json_schema", name: "apparel_projection_surface_v1", description: "Visible torso garment surface", schema, strict: true }),
    });
    const parsed = JSON.parse(response.output_text ?? "") as { box: Box | null; side: GarmentSurface["side"]; orientation: GarmentSurface["orientation"]; confidence: number; occluded: boolean };
    if (!validBox(parsed.box) || parsed.side !== side || !["frontal", "three_quarter"].includes(parsed.orientation) || !Number.isFinite(parsed.confidence) || parsed.confidence < .75 || parsed.confidence > 1 || parsed.occluded) return null;
    return { normalizedBoundingBox: parsed.box, side: parsed.side, orientation: parsed.orientation, confidence: parsed.confidence, occluded: parsed.occluded, mask: null };
  } catch { return null; }
}

export function resolveGarmentLandmarks(box: Box): GarmentLandmarks | null {
  if (!validBox(box)) return null;
  const { x, y, width: w, height: h } = box;
  return {
    collarCenter: { x: x + w / 2, y }, leftShoulderSeam: { x: x + .12 * w, y: y + .05 * h }, rightShoulderSeam: { x: x + .88 * w, y: y + .05 * h },
    leftTorsoEdge: { x, y: y + .5 * h }, rightTorsoEdge: { x: x + w, y: y + .5 * h }, lowerGarmentCenter: { x: x + w / 2, y: y + h },
    printSafeRectangle: { x: x + .12 * w, y: y + .12 * h, width: .76 * w, height: .73 * h },
  };
}
