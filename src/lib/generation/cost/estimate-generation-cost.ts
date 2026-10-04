import { getGenerationModelPricing } from "./model-pricing";

export type GenerationUsage = { inputTokens?: number; outputTokens?: number; imageInputTokens?: number; imageOutputTokens?: number };

export function estimateGenerationCostUsd(model: string, usage: GenerationUsage): number | null {
  const pricing = getGenerationModelPricing(model);
  if (!pricing) return null;
  const pairs = [
    [usage.inputTokens, pricing.inputPerMillionUsd],
    [usage.outputTokens, pricing.outputPerMillionUsd],
    [usage.imageInputTokens, pricing.imageInputPerMillionUsd],
    [usage.imageOutputTokens, pricing.imageOutputPerMillionUsd],
  ] as const;
  let hasUsage = false;
  let cost = 0;
  for (const [tokens, rate] of pairs) {
    if (tokens === undefined || rate === undefined) continue;
    if (!Number.isFinite(tokens) || tokens < 0) return null;
    hasUsage = true;
    cost += tokens * rate / 1_000_000;
  }
  return hasUsage ? cost : null;
}
