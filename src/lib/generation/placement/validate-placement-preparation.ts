import "server-only";

import { getOpenAIClient } from "@/lib/openai/client";
import { structuredResponseText } from "@/lib/openai/structured-response";
import { getReferenceAnalysisModel } from "../references/reference-analysis";
import type { GenerationStrategy } from "../strategy/generation-strategy";
import { mapPlacementReadinessResponse, resolvePlacementTargetRegion, unavailablePlacementReadiness, type PlacementReadinessResult } from "./placement-readiness";

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["issueCodes", "retryRecommended", "targetRegion"],
  properties: {
    issueCodes: { type: "array", items: { type: "string", enum: ["TARGET_REGION_NOT_VISIBLE", "TARGET_REGION_TOO_SMALL", "TARGET_REGION_OCCLUDED", "UNSUITABLE_FINGER_ORIENTATION", "UNSUITABLE_WRIST_ORIENTATION", "UNSUITABLE_FOOT_ORIENTATION", "PLACEMENT_SPACE_INSUFFICIENT", "BODY_REGION_OUT_OF_FRAME", "COMPETING_PRODUCT_PRESENT", "UNWANTED_JEWELRY_PRESENT", "REFERENCE_COMPOSITION_TOO_RESTRICTIVE", "ANATOMY_IMPLAUSIBLE"] } },
    retryRecommended: { type: "boolean" },
    targetRegion: { type: "string", enum: ["ring_finger", "wrist", "foot"] },
  },
} as const;

/** A narrow Stage A gate: it deliberately assesses only placement readiness, never product fidelity. */
export async function validatePlacementPreparationBestEffort(input: {
  imageData: Buffer;
  mimeType: string;
  strategy: GenerationStrategy;
}): Promise<PlacementReadinessResult> {
  try {
    const target = resolvePlacementTargetRegion(input.strategy);
    const response = await getOpenAIClient().responses.create({
      model: getReferenceAnalysisModel(),
      instructions: `Assess this product-free placement scene only for ${target} readiness. Return issue codes only: visibility, scale, occlusion, orientation, placement space, frame, competing product, unwanted jewelry, restrictive reference composition, or anatomy. For a ring finger require a visible, sharply readable, unobstructed ring finger with enough circumference and no ring. For a wrist require clear case/strap area and no incompatible watch. For a foot require usable shoe area and ground/contact geometry with no competing footwear. Reference composition may be adjusted when it conflicts with readiness. Do not assess product identity or beauty.`,
      input: [{ role: "user", content: [{ type: "input_image", image_url: `data:${input.mimeType};base64,${input.imageData.toString("base64")}`, detail: "low" }] }],
      max_output_tokens: 100,
      store: false,
      text: structuredResponseText({ type: "json_schema", name: "placement_preparation", description: "Placement readiness.", schema, strict: true }),
    });
    return mapPlacementReadinessResponse(JSON.parse(response.output_text ?? ""), input.strategy);
  } catch {
    return unavailablePlacementReadiness(input.strategy);
  }
}
