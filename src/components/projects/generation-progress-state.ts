import type { GenerationState, GenerationOperation } from "@/components/projects/generation-status-indicator";

export type GenerationProgressState = {
  operation: GenerationOperation;
  status: GenerationState;
  modalOpen: boolean;
  generationId: string | null;
  error: string | null;
};

export function startGenerationProgress(operation: GenerationOperation): GenerationProgressState {
  return { operation, status: "queued", modalOpen: true, generationId: null, error: null };
}

export function setProgressModalVisibility(state: GenerationProgressState, modalOpen: boolean): GenerationProgressState {
  return { ...state, modalOpen };
}

export function finishGenerationProgress(state: GenerationProgressState, generationId: string): GenerationProgressState {
  return { ...state, status: "succeeded", modalOpen: false, generationId, error: null };
}

export function failGenerationProgress(state: GenerationProgressState, error: string): GenerationProgressState {
  return { ...state, status: "failed", modalOpen: false, error };
}
