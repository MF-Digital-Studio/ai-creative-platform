import type { ImageGenerationQuality } from "@/lib/generation/types";

export type GenerationDifficulty = "high" | "medium";
export type GenerationExecutionReason = "artwork_text" | "exact_product" | "simple_logo" | "jewelry_geometry" | "watch_geometry" | "watch_dial_detail" | "identity_critical" | "reference_replacement" | "plain_apparel" | "simple_still_life" | "detailed_product";

export type GenerationExecutionPolicy = {
  version: "generation-execution-policy-v1";
  quality: Exclude<ImageGenerationQuality, "max">;
  difficulty: GenerationDifficulty;
  reasons: GenerationExecutionReason[];
  promptEnhancement: boolean;
  validationRequired: true;
  repairEligible: boolean;
  repairQuality: "high" | "xhigh";
  reuseCachedAnalysis: true;
  parallelizablePreprocessing: string[];
};
