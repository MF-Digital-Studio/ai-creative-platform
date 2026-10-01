import {
  isProductProfile,
  PRODUCT_PROFILE_ANALYSIS_VERSION,
  PRODUCT_PROFILE_SCHEMA_VERSION,
  type ProductProfile,
} from "./product-profile";

export { PRODUCT_PROFILE_ANALYSIS_VERSION, PRODUCT_PROFILE_SCHEMA_VERSION } from "./product-profile";

export type ProductAnalysisAsset = {
  id: string;
  productProfile: unknown;
};

export type ProductAnalysisRepository = {
  findOwnedProductAsset(userId: string, assetId: string): Promise<ProductAnalysisAsset | null>;
  saveProfile(userId: string, assetId: string, profile: ProductProfile): Promise<boolean>;
};

export type ProductAnalysisResult =
  | { status: "supported"; profile: ProductProfile; reused: boolean }
  | { status: "unsupported"; inferredCategory: string | null; reason: "unsupported_product" }
  | { status: "failed"; reason: "asset_not_found" | "analysis_failed" | "invalid_response" };

function isCurrentProfile(value: unknown): value is ProductProfile {
  return isProductProfile(value)
    && value.schemaVersion === PRODUCT_PROFILE_SCHEMA_VERSION
    && value.analysisVersion === PRODUCT_PROFILE_ANALYSIS_VERSION;
}

export function getProductProfileFromStoredValue(value: unknown): ProductProfile | null {
  return isProductProfile(value) ? value : null;
}

export async function persistProductAnalysisResult(input: {
  assetId: string;
  force?: boolean;
  model: string;
  response: unknown;
  repository: ProductAnalysisRepository;
  userId: string;
}): Promise<ProductAnalysisResult> {
  const asset = await input.repository.findOwnedProductAsset(input.userId, input.assetId);
  if (!asset) return { status: "failed", reason: "asset_not_found" };
  if (!input.force && isCurrentProfile(asset.productProfile)) {
    return { status: "supported", profile: asset.productProfile, reused: true };
  }

  if (input.response && typeof input.response === "object" && "status" in input.response && input.response.status === "unsupported") {
    const inferredCategory = "inferredCategory" in input.response && typeof input.response.inferredCategory === "string"
      ? input.response.inferredCategory
      : null;
    return { status: "unsupported", inferredCategory, reason: "unsupported_product" };
  }
  const candidate = input.response && typeof input.response === "object" && "profile" in input.response
    ? input.response.profile
    : null;
  if (!isCurrentProfile(candidate) || candidate.productId !== asset.id) {
    return { status: "failed", reason: "invalid_response" };
  }
  const profile: ProductProfile = {
    ...candidate,
    source: { ...candidate.source, model: input.model, analysisVersion: PRODUCT_PROFILE_ANALYSIS_VERSION, analyzedAt: new Date().toISOString() },
  };
  if (!await input.repository.saveProfile(input.userId, asset.id, profile)) {
    return { status: "failed", reason: "analysis_failed" };
  }
  return { status: "supported", profile, reused: false };
}
