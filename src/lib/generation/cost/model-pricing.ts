export type ModelPricing = { inputPerMillionUsd?: number; outputPerMillionUsd?: number; imageInputPerMillionUsd?: number; imageOutputPerMillionUsd?: number };

/** Set JSON in GENERATION_MODEL_PRICING, keyed by exact API model name. */
export function getGenerationModelPricing(model: string): ModelPricing | null {
  try {
    const value: unknown = JSON.parse(process.env.GENERATION_MODEL_PRICING ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const entry = (value as Record<string, unknown>)[model];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const pricing = entry as Record<string, unknown>;
    const valid = Object.values(pricing).every((amount) => typeof amount === "number" && Number.isFinite(amount) && amount >= 0);
    return valid ? pricing as ModelPricing : null;
  } catch { return null; }
}
