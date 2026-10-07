export async function dispatchQueuedGeneration(
  generationId: string,
  run: (generationId: string) => Promise<{ ok: boolean; message?: string }>,
  markFailed: (generationId: string) => Promise<void>,
): Promise<boolean> {
  console.info("[generation-dispatch] start", { generationId });
  try {
    console.info("[generation-dispatch] pipeline_entered", { generationId });
    const result = await run(generationId);
    if (result.ok) return true;
    console.error("[generation-queue] dispatch_failed", { generationId, errorName: "GenerationDispatchError", errorCode: result.message ?? "unknown" });
  } catch (error) {
    console.error("[generation-queue] dispatch_failed", {
      generationId,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode: "dispatch_exception",
    });
  }
  try {
    await markFailed(generationId);
  } catch {
    console.error("[generation-queue] failure_persist_failed", { generationId, errorCode: "failure_persistence_exception" });
  }
  return false;
}
