import { isReferenceStyleBrief, type ReferenceStyleBrief } from "./reference-style-brief";

export type ReferenceAnalysisCache = {
  version: number;
  model: string;
  orderedAssetIds: string[];
  styleBrief: ReferenceStyleBrief;
  analyzedAt: string;
};

export function readReferenceAnalysisCache(value: unknown, expected: { version: number; model: string; orderedAssetIds: readonly string[] }): ReferenceAnalysisCache | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const cache = value as Partial<ReferenceAnalysisCache>;
  if (cache.version !== expected.version || cache.model !== expected.model || !Array.isArray(cache.orderedAssetIds) || cache.orderedAssetIds.length !== expected.orderedAssetIds.length || cache.orderedAssetIds.some((id, index) => id !== expected.orderedAssetIds[index]) || !isReferenceStyleBrief(cache.styleBrief)) return null;
  return cache as ReferenceAnalysisCache;
}
