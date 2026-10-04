export type GenerationPerformanceStage = "asset_load" | "product_understanding" | "artwork_localization" | "prompt_compile" | "prompt_enhancement" | "provider_initial" | "hybrid_projection" | "validation_initial" | "provider_repair" | "validation_repair" | "storage" | "total";

export function createGenerationPerformanceRecorder(generationId: string, startedAt = Date.now()) {
  const durations: Partial<Record<GenerationPerformanceStage, number>> = {};
  return {
    async measure<T>(stage: GenerationPerformanceStage, operation: () => Promise<T>): Promise<T> {
      const start = Date.now();
      try { return await operation(); }
      finally {
        const durationMs = Math.max(0, Date.now() - start);
        durations[stage] = durationMs;
        console.info("[generation-performance] stage", { generationId, stage, durationMs });
      }
    },
    finish() {
      const durationMs = Math.max(0, Date.now() - startedAt);
      durations.total = durationMs;
      console.info("[generation-performance] stage", { generationId, stage: "total", durationMs });
      return { ...durations };
    },
  };
}
