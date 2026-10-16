import { awaitGenerationPipeline } from "./await-generation-pipeline";

type PipelineRunner = (id: string) => Promise<{ ok: boolean }>;
type QueuedFailureFinalizer = (id: string, category: string) => Promise<unknown>;

export async function dispatchQueuedGeneration(
  generationId: string,
  runPipeline?: PipelineRunner,
  finalizeQueuedFailure?: QueuedFailureFinalizer,
): Promise<boolean> {
  const runner = runPipeline ?? (await import("@/app/[locale]/dashboard/projects/[projectId]/generation-actions")).runQueuedImageGeneration;
  const succeeded = await awaitGenerationPipeline(generationId, runner);
  if (succeeded) return true;

  // A runner can return false before its queued→processing claim. Finalizing
  // only queued records preserves an in-flight duplicate worker's ownership.
  try {
    const finalizer = finalizeQueuedFailure ?? (await import("./worker-lifecycle")).finalizeQueuedGenerationFailure;
    await finalizer(generationId, "dispatch_failed");
  } catch (error) {
    console.error("[generation-dispatch] queued_failure_finalization_failed", {
      generationId,
      reason: error instanceof Error ? error.name : "finalization_error",
    });
  }
  return false;
}
