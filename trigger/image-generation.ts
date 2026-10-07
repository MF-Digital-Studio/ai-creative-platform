import { AbortTaskRunError, task } from "@trigger.dev/sdk";

import { runQueuedImageGeneration } from "../src/app/[locale]/dashboard/projects/[projectId]/generation-actions";
import { finalizeGenerationFailure, prepareGenerationRetry } from "../src/lib/generation/worker-lifecycle";

const MAX_ATTEMPTS = 3;

export const imageGenerationTask = task({
  id: "image-generation-v1",
  queue: { concurrencyLimit: 3 },
  retry: { maxAttempts: MAX_ATTEMPTS, factor: 2, minTimeoutInMs: 2_000, maxTimeoutInMs: 30_000, randomize: true },
  run: async ({ generationId }: { generationId: string }, { ctx }) => {
    const startedAt = Date.now();
    const attempt = ctx.attempt.number;
    console.info("[background-job] started", { generationId, attempt });
    const result = await runQueuedImageGeneration(generationId);
    if (result.ok || result.message === "notQueued") {
      console.info("[background-job] completed", { generationId, attempt, duration: Date.now() - startedAt });
      return result;
    }
    if (result.retryable && attempt < MAX_ATTEMPTS) {
      await prepareGenerationRetry(generationId);
      console.warn("[background-job] retrying", { generationId, attempt, failureCategory: result.failureCategory ?? "transient_infrastructure", duration: Date.now() - startedAt });
      throw new Error("Retryable image generation infrastructure failure");
    }
    await finalizeGenerationFailure(generationId, result.failureCategory ?? "generation_failed");
    console.error("[background-job] failed", { generationId, attempt, failureCategory: result.failureCategory ?? "generation_failed", duration: Date.now() - startedAt });
    throw new AbortTaskRunError("Image generation reached a terminal failure");
  },
});
