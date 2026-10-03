export const GENERATION_PROGRESS_EVENT = "klay-project-generation-progress";

export function announceGenerationProgress(active: boolean) {
  window.dispatchEvent(new CustomEvent(GENERATION_PROGRESS_EVENT, { detail: active }));
}
