import "server-only";

import { getOpenAIClient } from "@/lib/openai/client";
import { structuredResponseText } from "@/lib/openai/structured-response";
import { getReferenceAnalysisModel } from "@/lib/generation/references/reference-analysis";
import { buildValidationBrief, renderValidationInstructions } from "./build-validation-brief";
import { mapStructuredValidationOutput, resolveQualityGate } from "./resolve-quality-gate";
import { FIDELITY_VALIDATION_VERSION } from "./validation-version";
import type { FidelityValidationClient, FidelityValidationInput, FidelityValidationResult } from "./types";
import { fidelityValidationCategories } from "./types";

const validationSchema = {
  type: "object",
  additionalProperties: false,
  required: ["findings"],
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["code", "category", "severity", "confidence", "identityImpact", "likelyCause", "finding", "expected"],
        properties: {
          code: { type: "string" },
          category: { type: "string", enum: fidelityValidationCategories },
          severity: { type: "string", enum: ["critical", "major", "minor"] },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          identityImpact: { type: "string", enum: ["none", "minor", "major", "critical"] },
          likelyCause: { type: "string", enum: ["source_identity_drift", "perspective", "fabric_deformation", "lighting", "body_interaction", "typography_change", "geometry_change", "unknown"] },
          finding: { type: "string" },
          expected: { type: "string" },
        },
      },
    },
  },
} as const;

export function getFidelityValidationModel(): string {
  return process.env.OPENAI_FIDELITY_VALIDATION_MODEL?.trim() || getReferenceAnalysisModel();
}

function imageInput(data: Buffer, mimeType: string) {
  return { type: "input_image" as const, image_url: `data:${mimeType};base64,${data.toString("base64")}`, detail: "high" as const };
}

class OpenAIFidelityValidationClient implements FidelityValidationClient {
  async validate(input: FidelityValidationInput, brief: ReturnType<typeof buildValidationBrief>): Promise<unknown> {
    const response = await getOpenAIClient().responses.create({
      model: getFidelityValidationModel(),
      instructions: renderValidationInstructions(brief),
      input: [{ role: "user", content: [
        { type: "input_text", text: input.apparelArtworkIdentity ? "Image 1 is source garment authority. Image 2 is exact source artwork identity crop. The final image is generated output; if a reference scene is also shown, it is scene authority only. Compare typography/artwork to image 2 and placement to image 1." : input.referenceBaseScene ? "Image 1 is the authoritative source product. Image 2 is the authoritative reference base scene. Image 3 is the edited output. Check product identity against Image 1 and scene preservation against Image 2." : "Image 1 is the authoritative source product. Image 2 is the generated output. Identify only material deviations under the supplied validation policy." },
        imageInput(input.originalProduct, input.originalMimeType),
        ...(input.apparelArtworkIdentity ? [imageInput(input.apparelArtworkIdentity.data, input.apparelArtworkIdentity.mimeType)] : []),
        ...(input.referenceBaseScene ? [imageInput(input.referenceBaseScene, input.referenceBaseSceneMimeType ?? "image/png")] : []),
        imageInput(input.generatedImage, input.generatedMimeType),
      ] }],
      max_output_tokens: 1800,
      store: false,
      text: structuredResponseText({
        type: "json_schema",
        name: "fidelity_validation",
        description: "Structured calibrated fidelity findings with confidence, identity impact, likely cause, and product usability context.",
        schema: validationSchema,
        strict: true,
      }),
    });
    const output = response.output_text?.trim();
    if (!output) throw new Error("Fidelity validation returned no structured output.");
    return JSON.parse(output) as unknown;
  }
}

export async function validateGeneratedImage(input: FidelityValidationInput, client: FidelityValidationClient = new OpenAIFidelityValidationClient()): Promise<FidelityValidationResult> {
  const brief = buildValidationBrief({ ...input, referencePreservation: Boolean(input.referenceBaseScene), apparelArtworkIdentity: input.apparelArtworkIdentity ? { available: true, containsText: input.apparelArtworkIdentity.containsText, side: input.apparelArtworkIdentity.side, confidence: input.apparelArtworkIdentity.confidence } : null });
  if (input.exactProductApparel && input.apparelArtworkIdentity) {
    const result = await client.validate(input, brief);
    const raw = mapStructuredValidationOutput(result).filter((issue) => brief.humanRealism?.applied || issue.category !== "human_realism");
    const gate = resolveQualityGate(raw);
    return { ...gate, version: FIDELITY_VALIDATION_VERSION };
  }
  const raw = await client.validate(input, brief);
  const result = resolveQualityGate(mapStructuredValidationOutput(raw).filter((issue) => brief.humanRealism?.applied || issue.category !== "human_realism"));
  return { ...result, version: FIDELITY_VALIDATION_VERSION };
}

export async function validateGeneratedImageBestEffort(input: FidelityValidationInput): Promise<FidelityValidationResult> {
  try {
    return await validateGeneratedImage(input);
  } catch {
    return {
      status: "validation_unavailable",
      checks: [],
      issues: [],
      severity: null,
      retryRecommended: false,
      commerciallyUsable: false,
      summary: "Semantic fidelity validation was unavailable; generation remains accessible and was not marked as passed.",
      version: FIDELITY_VALIDATION_VERSION,
    };
  }
}
