import "server-only";

import sharp from "sharp";

import { getOpenAIClient } from "@/lib/openai/client";
import { getOpenAIDiagnostic } from "@/lib/openai/response-diagnostics";
import { structuredResponseText } from "@/lib/openai/structured-response";
import { getReferenceAnalysisModel } from "@/lib/generation/references/reference-analysis";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  mapProductAnalysisModelOutput,
  createProductAnalysisInput,
  productAnalysisModelOutputSchema,
} from "./product-analysis-model-output";

import {
  isProductProfile,
  PRODUCT_PROFILE_ANALYSIS_VERSION,
  PRODUCT_PROFILE_SCHEMA_VERSION,
  type ProductProfile,
} from "./product-profile";

export { PRODUCT_PROFILE_ANALYSIS_VERSION, PRODUCT_PROFILE_SCHEMA_VERSION } from "./product-profile";

type AnalysisAsset = {
  id: string;
  bucketId: string;
  objectPath: string;
  productProfile: unknown;
};

type ProductUnderstandingRepository = {
  findOwnedProductAsset(userId: string, assetId: string): Promise<AnalysisAsset | null>;
  downloadAsset(asset: AnalysisAsset): Promise<{ data: Buffer; mimeType: string } | null>;
  saveProfile(userId: string, assetId: string, profile: ProductProfile): Promise<boolean>;
};

export type ProductAnalysisClient = {
  analyze(input: { assetId: string; image: { data: Buffer; mimeType: string } }): Promise<unknown>;
};

export type ProductAnalysisResult =
  | { status: "supported"; profile: ProductProfile; reused: boolean }
  | { status: "unsupported"; inferredCategory: string | null; reason: "unsupported_product" }
  | { status: "failed"; reason: "asset_not_found" | "asset_unavailable" | "analysis_failed" | "invalid_response" };

export type AnalyzeProductAssetOptions = {
  assetId: string;
  force?: boolean;
  userId: string;
};

const analysisImageMaximum = 2048;

function isCurrentProfile(value: unknown): value is ProductProfile {
  return isProductProfile(value)
    && value.schemaVersion === PRODUCT_PROFILE_SCHEMA_VERSION
    && value.analysisVersion === PRODUCT_PROFILE_ANALYSIS_VERSION;
}

function isUnsupportedResponse(value: unknown): value is { status: "unsupported"; inferredCategory: string | null } {
  return Boolean(
    value && typeof value === "object" && "status" in value && (value as { status?: unknown }).status === "unsupported",
  );
}

function logAnalysis(event: string, details: Record<string, string | number | boolean | null>) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[product-understanding] ${event}`, details);
  }
}

export async function prepareProductAnalysisImage(
  image: { data: Buffer; mimeType: string },
): Promise<{ data: Buffer; mimeType: "image/jpeg" } | null> {
  try {
    const metadata = await sharp(image.data, { limitInputPixels: 50_000_000 }).metadata();
    if (!metadata.width || !metadata.height) return null;

    return {
      data: await sharp(image.data, { limitInputPixels: 50_000_000 })
        .rotate()
        .resize({ width: analysisImageMaximum, height: analysisImageMaximum, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 88, mozjpeg: true })
        .toBuffer(),
      mimeType: "image/jpeg",
    };
  } catch {
    return null;
  }
}

export async function analyzeProductAssetWithDependencies(
  options: AnalyzeProductAssetOptions,
  dependencies: { client: ProductAnalysisClient; repository: ProductUnderstandingRepository },
): Promise<ProductAnalysisResult> {
  const asset = await dependencies.repository.findOwnedProductAsset(options.userId, options.assetId);
  if (!asset) return { status: "failed", reason: "asset_not_found" };

  if (!options.force && isCurrentProfile(asset.productProfile)) {
    return { status: "supported", profile: asset.productProfile, reused: true };
  }

  const downloaded = await dependencies.repository.downloadAsset(asset);
  if (!downloaded) return { status: "failed", reason: "asset_unavailable" };
  const prepared = await prepareProductAnalysisImage(downloaded);
  if (!prepared) return { status: "failed", reason: "asset_unavailable" };

  let response: unknown;
  try {
    response = await dependencies.client.analyze({ assetId: asset.id, image: prepared });
  } catch (error) {
    const diagnostic = getOpenAIDiagnostic(error);
    logAnalysis("openai_error", {
      assetId: asset.id,
      status: diagnostic.status,
      code: diagnostic.errorCode,
      type: diagnostic.errorType,
      param: diagnostic.param,
      message: diagnostic.safeMessage,
      model: getProductUnderstandingModel(),
      analysisVersion: PRODUCT_PROFILE_ANALYSIS_VERSION,
    });
    return { status: "failed", reason: "analysis_failed" };
  }

  if (isUnsupportedResponse(response)) {
    logAnalysis("unsupported", {
      assetId: asset.id,
      inferredCategory: response.inferredCategory,
      analysisVersion: PRODUCT_PROFILE_ANALYSIS_VERSION,
    });
    return { status: "unsupported", inferredCategory: response.inferredCategory, reason: "unsupported_product" };
  }

  const candidate = response && typeof response === "object" && "profile" in response
    ? response.profile
    : null;
  if (!isCurrentProfile(candidate) || candidate.productId !== asset.id) {
    logAnalysis("failed", { assetId: asset.id, reason: "invalid_response", status: null });
    return { status: "failed", reason: "invalid_response" };
  }

  const profile: ProductProfile = {
    ...candidate,
    // Server values are authoritative even if a model echoes a different source record.
    source: {
      ...candidate.source,
      analysisVersion: PRODUCT_PROFILE_ANALYSIS_VERSION,
      model: getProductUnderstandingModel(),
      analyzedAt: new Date().toISOString(),
    },
  };
  logAnalysis("profile_validated", {
    assetId: asset.id,
    vertical: profile.vertical,
    subcategory: profile.subcategory,
  });
  if (!await dependencies.repository.saveProfile(options.userId, asset.id, profile)) {
    return { status: "failed", reason: "analysis_failed" };
  }
  logAnalysis("profile_persisted", { assetId: asset.id });

  logAnalysis("analyzed", {
    assetId: asset.id,
    status: "supported",
    vertical: profile.vertical,
    subcategory: profile.subcategory,
    model: profile.source.model,
    schemaVersion: profile.schemaVersion,
    analysisVersion: profile.analysisVersion,
  });
  return { status: "supported", profile, reused: false };
}

/**
 * This repository deliberately creates a fresh direct Supabase client for
 * every operation. It must never share the request/cookie-aware SSR client:
 * a user access token would replace the secret-key Authorization header.
 */
export class SupabaseProductUnderstandingRepository implements ProductUnderstandingRepository {
  async findOwnedProductAsset(userId: string, assetId: string): Promise<AnalysisAsset | null> {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("assets")
      .select("id, bucket_id, object_path, product_profile")
      .eq("id", assetId)
      .eq("user_id", userId)
      .eq("asset_type", "product")
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      bucketId: data.bucket_id,
      objectPath: data.object_path,
      productProfile: data.product_profile,
    };
  }

  async downloadAsset(asset: AnalysisAsset) {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin.storage.from(asset.bucketId).download(asset.objectPath);
    if (error || !data) return null;
    return { data: Buffer.from(await data.arrayBuffer()), mimeType: data.type || "image/png" };
  }

  async saveProfile(userId: string, assetId: string, profile: ProductProfile) {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("assets")
      // ProductProfile was validated immediately before this call. The query
      // also constrains the privileged write to the owned product row only.
      .update({ product_profile: profile })
      .eq("id", assetId)
      .eq("user_id", userId)
      .eq("asset_type", "product")
      .select("id")
      .maybeSingle();
    if (error) {
      const diagnostic = getOpenAIDiagnostic(error);
      logAnalysis("persist_error", {
        assetId,
        code: diagnostic.errorCode,
        message: diagnostic.safeMessage,
      });
    }
    return !error && Boolean(data);
  }
}

const regionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["description", "location"],
  properties: { description: { type: "string" }, location: { type: "string" } },
} as const;

/** Retained as a domain reference; model requests use the flat schema above. */
export const legacyProductProfileSchema = {
  type: "object",
  additionalProperties: false,
  required: ["status", "profile", "inferredCategory"],
  properties: {
    status: { type: "string", enum: ["supported", "unsupported"] },
    inferredCategory: { type: ["string", "null"] },
    profile: { anyOf: [{ type: "null" }, {
      type: "object",
      additionalProperties: false,
      required: ["productId", "schemaVersion", "analysisVersion", "vertical", "subcategory", "wearability", "rigidity", "materials", "dominantColors", "productShape", "identityCriticalAttributes", "visibleBranding", "interactionTargets", "allowedTransformations", "forbiddenTransformations", "sceneAffinities", "confidence", "source", "verticalAttributes"],
      properties: {
        productId: { type: "string" }, schemaVersion: { type: "number" }, analysisVersion: { type: "string" },
        vertical: { type: "string", enum: ["apparel", "jewelry", "watches", "cosmetics", "footwear"] }, subcategory: { type: ["string", "null"] },
        wearability: { type: "string", enum: ["wearable", "non_wearable", "context_dependent"] }, rigidity: { type: "string", enum: ["rigid", "semi_rigid", "deformable"] },
        materials: { type: "array", items: { type: "string" } }, dominantColors: { type: "array", items: { type: "string" } }, productShape: { type: "string" },
        identityCriticalAttributes: { type: "array", items: { type: "object", additionalProperties: false, required: ["attribute", "rationale", "regions"], properties: { attribute: { type: "string" }, rationale: { type: "string" }, regions: { type: "array", items: regionSchema } } } },
        visibleBranding: { type: "object", additionalProperties: false, required: ["hasLogo", "hasReadableText", "hasArtwork", "logoRegions", "textRegions", "artworkRegions"], properties: { hasLogo: { type: "boolean" }, hasReadableText: { type: "boolean" }, hasArtwork: { type: "boolean" }, logoRegions: { type: "array", items: regionSchema }, textRegions: { type: "array", items: regionSchema }, artworkRegions: { type: "array", items: regionSchema } } },
        interactionTargets: { type: "array", items: { type: "string", enum: ["finger", "wrist", "neck", "ear", "foot", "torso", "hand", "none"] } },
        allowedTransformations: { type: "array", items: { type: "string", enum: ["natural_fabric_deformation", "perspective_change", "lighting_or_reflection_change", "body_fitting", "natural_pose_flex", "none"] } },
        forbiddenTransformations: { type: "array", items: { type: "string", enum: ["recolor", "logo_movement", "geometry_redesign", "gemstone_count_change", "dial_layout_change", "outsole_redesign", "label_redesign", "text_or_artwork_change", "packaging_redesign"] } },
        sceneAffinities: { type: "object", additionalProperties: false, required: ["recommendedSceneTags", "discouragedSceneTags"], properties: { recommendedSceneTags: { type: "array", items: { type: "string" } }, discouragedSceneTags: { type: "array", items: { type: "string" } } } },
        confidence: { type: "object", additionalProperties: false, required: ["overall", "fields"], properties: { overall: { type: "number", minimum: 0, maximum: 1 }, fields: { anyOf: [{ type: "null" }, { type: "object", additionalProperties: false, properties: { vertical: { type: "number" }, subcategory: { type: "number" }, materials: { type: "number" }, wearability: { type: "number" }, rigidity: { type: "number" }, visibleBranding: { type: "number" }, verticalAttributes: { type: "number" } } }] } } },
        source: { type: "object", additionalProperties: false, required: ["model", "analysisVersion", "analyzedAt"], properties: { model: { type: "string" }, analysisVersion: { type: "string" }, analyzedAt: { type: "string" } } },
        verticalAttributes: { anyOf: [
          { type: "object", additionalProperties: false, required: ["vertical", "details"], properties: { vertical: { const: "apparel" }, details: { type: "object", additionalProperties: false, required: ["garmentType", "primaryColor", "artworkOrLogoLocations", "closures", "pocketStructure", "hoodOrCollar", "constructionDetails", "identitySides"], properties: { garmentType: { type: "string" }, primaryColor: { type: ["string", "null"] }, artworkOrLogoLocations: { type: "array", items: regionSchema }, closures: { type: "array", items: { type: "string" } }, pocketStructure: { type: "array", items: { type: "string" } }, hoodOrCollar: { type: ["string", "null"] }, constructionDetails: { type: "array", items: { type: "string" } }, identitySides: { type: "array", items: { type: "string", enum: ["front", "back"] } } } } } },
          { type: "object", additionalProperties: false, required: ["vertical", "details"], properties: { vertical: { const: "jewelry" }, details: { type: "object", additionalProperties: false, required: ["jewelryType", "metalColorOrMaterial", "centerStone", "centerStoneShape", "centerStoneColor", "stoneCount", "stoneLayout", "settingStyle", "bandOrChainStructure", "bodyPlacementTarget"], properties: { jewelryType: { type: "string" }, metalColorOrMaterial: { type: ["string", "null"] }, centerStone: { type: ["boolean", "null"] }, centerStoneShape: { type: ["string", "null"] }, centerStoneColor: { type: ["string", "null"] }, stoneCount: { type: ["number", "null"] }, stoneLayout: { type: ["string", "null"] }, settingStyle: { type: ["string", "null"] }, bandOrChainStructure: { type: ["string", "null"] }, bodyPlacementTarget: { type: "string", enum: ["finger", "wrist", "neck", "ear", "other", "none"] } } } } },
          { type: "object", additionalProperties: false, required: ["vertical", "details"], properties: { vertical: { const: "watches" }, details: { type: "object", additionalProperties: false, required: ["caseShape", "caseMaterialOrColor", "dialColor", "bezel", "crownSide", "pushers", "braceletOrStrap", "indicesOrMarkers", "dateWindow", "subdials", "dialBrandingRegions"], properties: { caseShape: { type: ["string", "null"] }, caseMaterialOrColor: { type: ["string", "null"] }, dialColor: { type: ["string", "null"] }, bezel: { type: ["string", "null"] }, crownSide: { type: "string", enum: ["left", "right", "other", "not_visible"] }, pushers: { type: ["string", "null"] }, braceletOrStrap: { type: ["string", "null"] }, indicesOrMarkers: { type: ["string", "null"] }, dateWindow: { type: ["string", "null"] }, subdials: { type: ["string", "null"] }, dialBrandingRegions: { type: "array", items: regionSchema } } } } },
          { type: "object", additionalProperties: false, required: ["vertical", "details"], properties: { vertical: { const: "cosmetics" }, details: { type: "object", additionalProperties: false, required: ["packageType", "packageGeometry", "containerForm", "closureOrDispenser", "materialOpacity", "liquidVisibility", "labelRegions", "logoRegions"], properties: { packageType: { type: "string" }, packageGeometry: { type: ["string", "null"] }, containerForm: { type: "string", enum: ["bottle", "jar", "tube", "compact", "other"] }, closureOrDispenser: { type: "string", enum: ["cap", "pump", "dropper", "spray", "other", "none"] }, materialOpacity: { type: "string", enum: ["transparent", "translucent", "opaque", "mixed"] }, liquidVisibility: { type: "string", enum: ["visible", "not_visible", "not_applicable"] }, labelRegions: { type: "array", items: regionSchema }, logoRegions: { type: "array", items: regionSchema } } } } },
          { type: "object", additionalProperties: false, required: ["vertical", "details"], properties: { vertical: { const: "footwear" }, details: { type: "object", additionalProperties: false, required: ["shoeType", "silhouette", "upperMaterial", "outsole", "midsole", "panelStructure", "lacing", "tongue", "heel", "logoRegions", "colorBlocking"], properties: { shoeType: { type: "string" }, silhouette: { type: ["string", "null"] }, upperMaterial: { type: "array", items: { type: "string" } }, outsole: { type: ["string", "null"] }, midsole: { type: ["string", "null"] }, panelStructure: { type: "array", items: { type: "string" } }, lacing: { type: ["string", "null"] }, tongue: { type: ["string", "null"] }, heel: { type: ["string", "null"] }, logoRegions: { type: "array", items: regionSchema }, colorBlocking: { type: "array", items: { type: "string" } } } } } },
        ] },
      },
    }] },
  },
} as const;

const analyzerInstructions = [
  "Analyze the supplied image as a product-understanding task.",
  "The product image is authoritative. Describe only visible, reasonably supported evidence; never invent hidden attributes.",
  "Do not assume brand, material composition, gemstone chemistry, exact color names, product function, or unreadable text. Prefer cautious visual descriptions such as silver-colored metal or blue center stone.",
  "Classify only apparel, jewelry, watches, cosmetics, or footwear. If the product does not clearly fit one, return status unsupported with no profile.",
  "For supported products, produce the complete flat analysis object defined by the response schema. Fill every required key; use null only where the schema permits it and for non-applicable vertical blocks. Keep identity-critical attributes concise and visual.",
  "Branding regions are semantic locations, not required OCR. Never fabricate exact words.",
  "Derive conservative transformations and scene tags. The profile is an interpretation, never a replacement for the source image.",
].join("\n");

export function getProductUnderstandingModel() {
  return process.env.OPENAI_PRODUCT_UNDERSTANDING_MODEL?.trim() || getReferenceAnalysisModel();
}

class OpenAIProductAnalysisClient implements ProductAnalysisClient {
  async analyze({ assetId, image }: Parameters<ProductAnalysisClient["analyze"]>[0]): Promise<unknown> {
    const response = await getOpenAIClient().responses.create({
      model: getProductUnderstandingModel(),
      instructions: analyzerInstructions,
      input: createProductAnalysisInput({ assetId, image }),
      max_output_tokens: 2200,
      store: false,
      text: structuredResponseText({
        type: "json_schema",
        name: "product_analysis",
        description: "Supported product profile or safe unsupported result.",
        schema: productAnalysisModelOutputSchema,
        strict: true,
      }),
    });
    const output = response.output_text?.trim();
    if (!output) throw new Error("Product analysis returned no structured output.");
    const parsed = JSON.parse(output) as unknown;
    const mapped = mapProductAnalysisModelOutput(parsed, {
      assetId,
      analyzedAt: new Date().toISOString(),
      model: getProductUnderstandingModel(),
    });
    if (!mapped) return { status: "invalid" };
    return "status" in mapped
      ? { status: "unsupported", inferredCategory: mapped.inferredCategory }
      : { status: "supported", inferredCategory: null, profile: mapped };
  }
}

export async function analyzeProductAsset(options: AnalyzeProductAssetOptions): Promise<ProductAnalysisResult> {
  logAnalysis("analyzer_entered", { assetId: options.assetId, force: Boolean(options.force) });
  try {
    return await analyzeProductAssetWithDependencies(options, {
      client: new OpenAIProductAnalysisClient(),
      repository: new SupabaseProductUnderstandingRepository(),
    });
  } catch (error) {
    const diagnostic = getOpenAIDiagnostic(error);
    logAnalysis("failed", {
      assetId: options.assetId,
      reason: "analysis_failed",
      status: diagnostic.status,
      model: getProductUnderstandingModel(),
    });
    return { status: "failed", reason: "analysis_failed" };
  }
}

export function getProductProfileFromStoredValue(value: unknown): ProductProfile | null {
  return isProductProfile(value) ? value : null;
}

/** Returns only a validated profile for an asset owned by the requesting user. */
export async function getProductProfileForAsset(userId: string, assetId: string): Promise<ProductProfile | null> {
  try {
    const repository = new SupabaseProductUnderstandingRepository();
    const asset = await repository.findOwnedProductAsset(userId, assetId);
    return asset ? getProductProfileFromStoredValue(asset.productProfile) : null;
  } catch {
    return null;
  }
}
