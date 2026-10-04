export function resolveTargetSurfaceReadiness(input: { targetLandmarksAvailable: boolean; minimumConfidence: number; confidence: number }): { ready: boolean; fallbackReason: "target_surface_unavailable" | null } {
  const ready = input.targetLandmarksAvailable && Number.isFinite(input.confidence) && input.confidence >= input.minimumConfidence;
  return { ready, fallbackReason: ready ? null : "target_surface_unavailable" };
}
