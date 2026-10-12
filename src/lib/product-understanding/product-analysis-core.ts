import {
  isProductProfile,
  PRODUCT_PROFILE_ANALYSIS_VERSION,
  PRODUCT_PROFILE_SCHEMA_VERSION,
  type ProductProfile,
} from "./product-profile";
import { validateProductAnalysisModelOutput, type ProductAnalysisOutputValidation } from "./product-analysis-model-output";

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
  | { status: "unsupported"; inferredCategory: string | null; unsupportedReason: string; reason: "unsupported_product" }
  | { status: "failed"; reason: "asset_not_found" | "analysis_failed" | "response_shape_mismatch" | "schema_validation_failed" | "id_mismatch" | "persistence_failed" };

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

  const raw = input.response;
  let validation: ProductAnalysisOutputValidation;
  if (raw && typeof raw === "object" && "output" in raw) {
    validation = raw as ProductAnalysisOutputValidation;
  } else if (raw && typeof raw === "object" && "status" in raw && raw.status === "unsupported") {
    validation = { output: { status: "unsupported", inferredCategory: "inferredCategory" in raw && typeof raw.inferredCategory === "string" ? raw.inferredCategory : null, unsupportedReason: "Provider classified the image as unsupported." }, errorPaths: [] };
  } else if (raw && typeof raw === "object" && "profile" in raw) {
    validation = { output: (raw as { profile: unknown }).profile as ProductProfile, errorPaths: [] };
  } else {
    validation = validateProductAnalysisModelOutput(raw, { assetId: asset.id, model: input.model, analyzedAt: new Date().toISOString() });
  }
  if (!validation.output) return { status: "failed", reason: "schema_validation_failed" };
  if ("status" in validation.output) {
    return { status: "unsupported", inferredCategory: validation.output.inferredCategory, unsupportedReason: validation.output.unsupportedReason || "No supported product category was detected.", reason: "unsupported_product" };
  }
  const candidate = validation.output;
  if (!isCurrentProfile(candidate) || candidate.productId !== asset.id) {
    return { status: "failed", reason: isProductProfile(candidate) ? "id_mismatch" : "schema_validation_failed" };
  }
  const profile: ProductProfile = {
    ...candidate,
    source: { ...candidate.source, model: input.model, analysisVersion: PRODUCT_PROFILE_ANALYSIS_VERSION, analyzedAt: new Date().toISOString() },
  };
  if (!await input.repository.saveProfile(input.userId, asset.id, profile)) {
    return { status: "failed", reason: "persistence_failed" };
  }
  return { status: "supported", profile, reused: false };
}
