import { isSupportedVertical, type SupportedVertical } from "@/lib/verticals/supported-verticals";

import {
  isProductProfile,
  PRODUCT_PROFILE_ANALYSIS_VERSION,
  PRODUCT_PROFILE_SCHEMA_VERSION,
  type ProductProfile,
} from "./product-profile";

const regionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["description", "location"],
  properties: { description: { type: "string" }, location: { type: "string" } },
} as const;

const nullableString = { type: ["string", "null"] } as const;
const nullableNumber = { type: ["number", "null"] } as const;

const apparelSchema = {
  type: ["object", "null"], additionalProperties: false,
  required: ["garmentType", "primaryColor", "artworkOrLogoLocations", "closures", "pocketStructure", "hoodOrCollar", "constructionDetails", "identitySides"],
  properties: { garmentType: { type: "string" }, primaryColor: nullableString, artworkOrLogoLocations: { type: "array", items: regionSchema }, closures: { type: "array", items: { type: "string" } }, pocketStructure: { type: "array", items: { type: "string" } }, hoodOrCollar: nullableString, constructionDetails: { type: "array", items: { type: "string" } }, identitySides: { type: "array", items: { type: "string", enum: ["front", "back"] } } },
} as const;
const jewelrySchema = {
  type: ["object", "null"], additionalProperties: false,
  required: ["jewelryType", "metalColorOrMaterial", "centerStone", "centerStoneShape", "centerStoneColor", "stoneCount", "stoneLayout", "settingStyle", "bandOrChainStructure", "bodyPlacementTarget"],
  properties: { jewelryType: { type: "string" }, metalColorOrMaterial: nullableString, centerStone: { type: ["boolean", "null"] }, centerStoneShape: nullableString, centerStoneColor: nullableString, stoneCount: nullableNumber, stoneLayout: nullableString, settingStyle: nullableString, bandOrChainStructure: nullableString, bodyPlacementTarget: { type: "string", enum: ["finger", "wrist", "neck", "ear", "other", "none"] } },
} as const;
const watchSchema = {
  type: ["object", "null"], additionalProperties: false,
  required: ["caseShape", "caseMaterialOrColor", "dialColor", "bezel", "crownSide", "pushers", "braceletOrStrap", "indicesOrMarkers", "dateWindow", "subdials", "dialBrandingRegions"],
  properties: { caseShape: nullableString, caseMaterialOrColor: nullableString, dialColor: nullableString, bezel: nullableString, crownSide: { type: "string", enum: ["left", "right", "other", "not_visible"] }, pushers: nullableString, braceletOrStrap: nullableString, indicesOrMarkers: nullableString, dateWindow: nullableString, subdials: nullableString, dialBrandingRegions: { type: "array", items: regionSchema } },
} as const;
const cosmeticsSchema = {
  type: ["object", "null"], additionalProperties: false,
  required: ["packageType", "packageGeometry", "containerForm", "closureOrDispenser", "materialOpacity", "liquidVisibility", "labelRegions", "logoRegions"],
  properties: { packageType: { type: "string" }, packageGeometry: nullableString, containerForm: { type: "string", enum: ["bottle", "jar", "tube", "compact", "other"] }, closureOrDispenser: { type: "string", enum: ["cap", "pump", "dropper", "spray", "other", "none"] }, materialOpacity: { type: "string", enum: ["transparent", "translucent", "opaque", "mixed"] }, liquidVisibility: { type: "string", enum: ["visible", "not_visible", "not_applicable"] }, labelRegions: { type: "array", items: regionSchema }, logoRegions: { type: "array", items: regionSchema } },
} as const;
const footwearSchema = {
  type: ["object", "null"], additionalProperties: false,
  required: ["shoeType", "silhouette", "upperMaterial", "outsole", "midsole", "panelStructure", "lacing", "tongue", "heel", "logoRegions", "colorBlocking"],
  properties: { shoeType: { type: "string" }, silhouette: nullableString, upperMaterial: { type: "array", items: { type: "string" } }, outsole: nullableString, midsole: nullableString, panelStructure: { type: "array", items: { type: "string" } }, lacing: nullableString, tongue: nullableString, heel: nullableString, logoRegions: { type: "array", items: regionSchema }, colorBlocking: { type: "array", items: { type: "string" } } },
} as const;

/** Flat, strict-schema-compatible model output. ProductProfile is assembled server-side. */
export const productAnalysisModelOutputSchema = {
  type: "object", additionalProperties: false,
  required: ["status", "inferredCategory", "vertical", "subcategory", "wearability", "rigidity", "materials", "dominantColors", "productShape", "identityCriticalAttributes", "visibleBranding", "interactionTargets", "allowedTransformations", "forbiddenTransformations", "recommendedSceneTags", "discouragedSceneTags", "confidence", "apparel", "jewelry", "watch", "cosmetics", "footwear"],
  properties: {
    status: { type: "string", enum: ["supported", "unsupported"] }, inferredCategory: nullableString,
    vertical: { type: ["string", "null"], enum: ["apparel", "jewelry", "watches", "cosmetics", "footwear", null] }, subcategory: nullableString,
    wearability: { type: "string", enum: ["wearable", "non_wearable", "context_dependent"] }, rigidity: { type: "string", enum: ["rigid", "semi_rigid", "deformable"] },
    materials: { type: "array", items: { type: "string" } }, dominantColors: { type: "array", items: { type: "string" } }, productShape: { type: "string" },
    identityCriticalAttributes: { type: "array", items: { type: "object", additionalProperties: false, required: ["attribute", "rationale", "regions"], properties: { attribute: { type: "string" }, rationale: { type: "string" }, regions: { type: "array", items: regionSchema } } } },
    visibleBranding: { type: "object", additionalProperties: false, required: ["hasLogo", "hasReadableText", "hasArtwork", "logoRegions", "textRegions", "artworkRegions"], properties: { hasLogo: { type: "boolean" }, hasReadableText: { type: "boolean" }, hasArtwork: { type: "boolean" }, logoRegions: { type: "array", items: regionSchema }, textRegions: { type: "array", items: regionSchema }, artworkRegions: { type: "array", items: regionSchema } } },
    interactionTargets: { type: "array", items: { type: "string", enum: ["finger", "wrist", "neck", "ear", "foot", "torso", "hand", "none"] } }, allowedTransformations: { type: "array", items: { type: "string", enum: ["natural_fabric_deformation", "perspective_change", "lighting_or_reflection_change", "body_fitting", "natural_pose_flex", "none"] } }, forbiddenTransformations: { type: "array", items: { type: "string", enum: ["recolor", "logo_movement", "geometry_redesign", "gemstone_count_change", "dial_layout_change", "outsole_redesign", "label_redesign", "text_or_artwork_change", "packaging_redesign"] } },
    recommendedSceneTags: { type: "array", items: { type: "string" } }, discouragedSceneTags: { type: "array", items: { type: "string" } },
    confidence: { type: "object", additionalProperties: false, required: ["overall", "vertical", "subcategory", "materials", "wearability", "rigidity", "visibleBranding", "verticalAttributes"], properties: { overall: { type: "number", minimum: 0, maximum: 1 }, vertical: nullableNumber, subcategory: nullableNumber, materials: nullableNumber, wearability: nullableNumber, rigidity: nullableNumber, visibleBranding: nullableNumber, verticalAttributes: nullableNumber } },
    apparel: apparelSchema, jewelry: jewelrySchema, watch: watchSchema, cosmetics: cosmeticsSchema, footwear: footwearSchema,
  },
} as const;

export function createProductAnalysisInput(input: { assetId: string; image: { data: Buffer; mimeType: string } }) {
  return [{
    role: "user" as const,
    content: [{
      type: "input_text" as const,
      text: `Analyze product asset ${input.assetId}. Return every required field. Use null for non-applicable category blocks and unknown nullable values.`,
    }, {
      type: "input_image" as const,
      image_url: `data:${input.image.mimeType};base64,${input.image.data.toString("base64")}`,
      detail: "high" as const,
    }],
  }];
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }

export function mapProductAnalysisModelOutput(value: unknown, source: { assetId: string; model: string; analyzedAt: string }): ProductProfile | { status: "unsupported"; inferredCategory: string | null } | null {
  if (!isRecord(value)) return null;
  if (value.status === "unsupported") return { status: "unsupported", inferredCategory: typeof value.inferredCategory === "string" ? value.inferredCategory : null };
  if (value.status !== "supported" || !isSupportedVertical(value.vertical)) return null;

  const blockName = value.vertical === "watches" ? "watch" : value.vertical;
  const details = value[blockName];
  if (!isRecord(details)) return null;
  const profile = {
    productId: source.assetId, schemaVersion: PRODUCT_PROFILE_SCHEMA_VERSION, analysisVersion: PRODUCT_PROFILE_ANALYSIS_VERSION,
    vertical: value.vertical as SupportedVertical, subcategory: typeof value.subcategory === "string" ? value.subcategory : null,
    wearability: value.wearability, rigidity: value.rigidity, materials: value.materials, dominantColors: value.dominantColors, productShape: value.productShape,
    identityCriticalAttributes: value.identityCriticalAttributes, visibleBranding: value.visibleBranding, interactionTargets: value.interactionTargets,
    allowedTransformations: value.allowedTransformations, forbiddenTransformations: value.forbiddenTransformations,
    sceneAffinities: { recommendedSceneTags: value.recommendedSceneTags, discouragedSceneTags: value.discouragedSceneTags },
    confidence: { overall: isRecord(value.confidence) ? value.confidence.overall : -1, fields: isRecord(value.confidence) ? { vertical: value.confidence.vertical ?? undefined, subcategory: value.confidence.subcategory ?? undefined, materials: value.confidence.materials ?? undefined, wearability: value.confidence.wearability ?? undefined, rigidity: value.confidence.rigidity ?? undefined, visibleBranding: value.confidence.visibleBranding ?? undefined, verticalAttributes: value.confidence.verticalAttributes ?? undefined } : undefined },
    source: { model: source.model, analysisVersion: PRODUCT_PROFILE_ANALYSIS_VERSION, analyzedAt: source.analyzedAt }, verticalAttributes: { vertical: value.vertical, details },
  } as unknown;
  return isProductProfile(profile) ? profile : null;
}
