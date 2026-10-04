export async function dispatchQueuedGeneration(
  generationId: string,
  run: (generationId: string) => Promise<{ ok: boolean; message?: string }>,
  markFailed: (generationId: string) => Promise<void>,
): Promise<boolean> {
  try {
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
  await markFailed(generationId);
  return false;
}
