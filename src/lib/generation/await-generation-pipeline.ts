export type GenerationPipelineRunner = (generationId: string) => Promise<{ ok: boolean }>;

export async function awaitGenerationPipeline(generationId: string, runner: GenerationPipelineRunner): Promise<boolean> {
  console.info("[generation-dispatch] start", { generationId });
  try {
    const result = await runner(generationId);
    if (!result.ok) console.warn("[generation-dispatch] completed_with_failure", { generationId });
    return result.ok;
  } catch (error) {
    console.error("[generation-dispatch] failed", { generationId, reason: error instanceof Error ? error.name : "pipeline_error" });
    return false;
  }
}
