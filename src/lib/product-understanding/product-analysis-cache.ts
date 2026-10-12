import { PRODUCT_PROFILE_ANALYSIS_VERSION, PRODUCT_PROFILE_SCHEMA_VERSION } from "./product-understanding-version";

export type ProductAnalysisCacheStatus = {
  status: "valid" | "unsupported" | "failed_transient";
  assetId: string;
  objectPath: string;
  analyzerVersion: string;
  schemaVersion: number;
  model: string;
  retryAfter?: string;
};

export type ProductAnalysisCacheIdentity = {
  assetId: string;
  objectPath: string;
  analyzerVersion: string;
  schemaVersion: number;
  model: string;
};

export type ProductAnalysisCacheDecision = "reuse_supported" | "reuse_unsupported" | "respect_retry_window" | "analyze";

export function isCurrentProductAnalysisCacheStatus(value: unknown, identity: ProductAnalysisCacheIdentity): value is ProductAnalysisCacheStatus {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const status = value as Partial<ProductAnalysisCacheStatus>;
  return status.assetId === identity.assetId
    && status.objectPath === identity.objectPath
    && status.analyzerVersion === identity.analyzerVersion
    && status.schemaVersion === identity.schemaVersion
    && status.model === identity.model
    && (status.status === "valid" || status.status === "unsupported" || status.status === "failed_transient");
}

export function decideProductAnalysisCache(input: {
  force: boolean;
  currentProfile: boolean;
  status: unknown;
  identity: Omit<ProductAnalysisCacheIdentity, "analyzerVersion" | "schemaVersion">;
  now?: number;
}): ProductAnalysisCacheDecision {
  if (input.force) return "analyze";
  if (input.currentProfile) return "reuse_supported";
  const identity: ProductAnalysisCacheIdentity = {
    ...input.identity,
    analyzerVersion: PRODUCT_PROFILE_ANALYSIS_VERSION,
    schemaVersion: PRODUCT_PROFILE_SCHEMA_VERSION,
  };
  if (!isCurrentProductAnalysisCacheStatus(input.status, identity)) return "analyze";
  if (input.status.status === "unsupported") return "reuse_unsupported";
  if (input.status.status === "failed_transient" && input.status.retryAfter && Date.parse(input.status.retryAfter) > (input.now ?? Date.now())) return "respect_retry_window";
  return "analyze";
}
