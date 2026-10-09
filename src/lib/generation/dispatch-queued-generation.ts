import { runQueuedImageGeneration } from "@/app/[locale]/dashboard/projects/[projectId]/generation-actions";
import { awaitGenerationPipeline } from "./await-generation-pipeline";

export async function dispatchQueuedGeneration(
  generationId: string,
  runPipeline?: (id: string) => Promise<{ ok: boolean }>,
): Promise<boolean> {
  return await awaitGenerationPipeline(generationId, runPipeline ?? runQueuedImageGeneration);
}
