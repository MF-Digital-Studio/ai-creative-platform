import { tasks } from "@trigger.dev/sdk";

export type DurableGenerationEnqueuer = (generationId: string) => Promise<void>;

export async function enqueueImageGeneration(generationId: string): Promise<void> {
  await tasks.trigger(
    "image-generation-v1",
    { generationId },
    { idempotencyKey: `image-generation:${generationId}`, idempotencyKeyTTL: "24h" },
  );
}

export async function dispatchQueuedGeneration(
  generationId: string,
  enqueue: DurableGenerationEnqueuer = enqueueImageGeneration,
): Promise<boolean> {
  const startedAt = Date.now();
  try {
    await enqueue(generationId);
    console.info("[background-job] enqueued", { generationId, attempt: 0, duration: Date.now() - startedAt });
    return true;
  } catch {
    console.error("[background-job] failed", { generationId, attempt: 0, failureCategory: "enqueue_failed", duration: Date.now() - startedAt });
    return false;
  }
}
