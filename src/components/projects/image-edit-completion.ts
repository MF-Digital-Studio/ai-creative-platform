export type ImageEditUiState = {
  pending: boolean;
  selectedGenerationId: string | null;
  clearInstruction: boolean;
  error: boolean;
  refresh: boolean;
};

export function resolveImageEditCompletion(result: { ok: true; generationId: string } | { ok: false }): ImageEditUiState {
  if (!result.ok) return { pending: false, selectedGenerationId: null, clearInstruction: false, error: true, refresh: false };
  return { pending: false, selectedGenerationId: result.generationId, clearInstruction: true, error: false, refresh: true };
}
