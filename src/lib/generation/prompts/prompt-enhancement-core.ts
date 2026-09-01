import type { ProductPreservationMode } from "../types";

export type CreativeBrief = {
  subject: string;
  pose: string;
  environment: string;
  composition: string;
  camera: string;
  lighting: string;
  mood: string;
  realism: string;
  productTreatment: string;
  negativeConstraints: string;
};

export type PromptEnhancementInput = {
  enabled: boolean;
  generationType: "image" | "video";
  preservationMode: ProductPreservationMode;
  productCategory?: string | null;
  presetId?: string | null;
  presetTitle?: string | null;
  presetDescription?: string | null;
  presetPromptSeed?: string | null;
  useCase?: string | null;
  generationMode?: "image" | "video" | null;
  userCreativeDirection: string;
};

export type PromptEnhancementResult = {
  enhancedPrompt: string | null;
  prompt: string;
  succeeded: boolean;
  userPrompt: string;
};

export type PromptEnhancementClient = {
  createCreativeBrief(input: PromptEnhancementInput): Promise<unknown>;
};

const creativeBriefFields = [
  "subject",
  "pose",
  "environment",
  "composition",
  "camera",
  "lighting",
  "mood",
  "realism",
  "productTreatment",
  "negativeConstraints",
] as const;

function isCreativeBrief(value: unknown): value is CreativeBrief {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return creativeBriefFields.every(
    (field) => typeof candidate[field] === "string" && candidate[field].trim().length > 0,
  );
}

export function renderEnhancedCreativePrompt(brief: CreativeBrief): string {
  return [
    "Professional creative direction:",
    `Subject: ${brief.subject.trim()}`,
    `Pose and action: ${brief.pose.trim()}`,
    `Environment: ${brief.environment.trim()}`,
    `Composition: ${brief.composition.trim()}`,
    `Camera: ${brief.camera.trim()}`,
    `Lighting: ${brief.lighting.trim()}`,
    `Mood: ${brief.mood.trim()}`,
    `Realism: ${brief.realism.trim()}`,
    `Product treatment: ${brief.productTreatment.trim()}`,
    `Negative constraints: ${brief.negativeConstraints.trim()}`,
  ].join("\n");
}

export async function enhanceCreativeDirectionWithClient(
  input: PromptEnhancementInput,
  client: PromptEnhancementClient,
): Promise<PromptEnhancementResult> {
  const userPrompt = input.userCreativeDirection.trim();
  const presetPromptSeed = input.presetPromptSeed?.trim() ?? "";
  const rawPrompt = [presetPromptSeed, userPrompt].filter(Boolean).join("\n\n");

  if (!input.enabled || !rawPrompt) {
    return { enhancedPrompt: null, prompt: rawPrompt, succeeded: false, userPrompt };
  }

  try {
    const brief = await client.createCreativeBrief({ ...input, userCreativeDirection: userPrompt });
    if (!isCreativeBrief(brief)) {
      return { enhancedPrompt: null, prompt: rawPrompt, succeeded: false, userPrompt };
    }

    const enhancedPrompt = renderEnhancedCreativePrompt(brief).trim();
    if (!enhancedPrompt) {
      return { enhancedPrompt: null, prompt: rawPrompt, succeeded: false, userPrompt };
    }

    return { enhancedPrompt, prompt: enhancedPrompt, succeeded: true, userPrompt };
  } catch {
    return { enhancedPrompt: null, prompt: rawPrompt, succeeded: false, userPrompt };
  }
}
