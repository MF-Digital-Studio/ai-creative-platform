import "server-only";

import { getOpenAIClient } from "@/lib/openai/client";
import { structuredResponseText } from "@/lib/openai/structured-response";
import { validateEditFidelity, type EditFidelityAssessment } from "./edit-intent";

const schema = {
  type: "object", additionalProperties: false,
  required: ["requestedChangeApplied", "baseScenePreserved", "productIdentityPreserved", "subjectIdentityPreserved", "posePreserved", "compositionPreserved", "unrelatedChanges"],
  properties: {
    requestedChangeApplied: { type: "boolean" }, baseScenePreserved: { type: "boolean" }, productIdentityPreserved: { type: "boolean" },
    subjectIdentityPreserved: { type: "boolean" }, posePreserved: { type: "boolean" }, compositionPreserved: { type: "boolean" }, unrelatedChanges: { type: "boolean" },
  },
} as const;

export async function validateImageEdit(input: { base: Buffer; edited: Buffer; instruction: string }): Promise<ReturnType<typeof validateEditFidelity>> {
  const response = await getOpenAIClient().responses.create({
    model: process.env.OPENAI_REFERENCE_ANALYSIS_MODEL?.trim() || "gpt-4.1-mini",
    input: [{ role: "user", content: [
      { type: "input_text", text: `Compare image 1 (original base) to image 2 (edit). Request: ${input.instruction}. Assess requested change, preservation, product identity, same person and pose, composition, and unrelated material changes. Be strict: fail if a change cannot be verified.` },
      { type: "input_image", image_url: `data:image/png;base64,${input.base.toString("base64")}`, detail: "high" },
      { type: "input_image", image_url: `data:image/png;base64,${input.edited.toString("base64")}`, detail: "high" },
    ] }],
    text: structuredResponseText({ type: "json_schema", name: "image_edit_fidelity", description: "Image edit preservation validation.", strict: true, schema: schema as unknown as Record<string, unknown> }),
  });
  const parsed = JSON.parse(response.output_text) as EditFidelityAssessment;
  return validateEditFidelity(parsed);
}
