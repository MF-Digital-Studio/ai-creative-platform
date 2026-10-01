import { isSupportedVertical } from "@/lib/verticals/supported-verticals";

import type { ProductProfile } from "./types";

export { PRODUCT_PROFILE_ANALYSIS_VERSION, PRODUCT_PROFILE_SCHEMA_VERSION } from "./product-understanding-version";
export type { ProductProfile } from "./types";

const wearabilityValues = new Set(["wearable", "non_wearable", "context_dependent"]);
const rigidityValues = new Set(["rigid", "semi_rigid", "deformable"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/** A lightweight boundary check for persisted or model-returned profile JSON. */
export function isProductProfile(value: unknown): value is ProductProfile {
  if (!isObject(value) || !isSupportedVertical(value.vertical)) return false;

  const verticalAttributes = value.verticalAttributes;
  if (!isObject(verticalAttributes) || verticalAttributes.vertical !== value.vertical || !isObject(verticalAttributes.details)) {
    return false;
  }

  return (
    typeof value.productId === "string" &&
    typeof value.schemaVersion === "number" &&
    typeof value.analysisVersion === "string" &&
    (typeof value.subcategory === "string" || value.subcategory === null) &&
    typeof value.wearability === "string" && wearabilityValues.has(value.wearability) &&
    typeof value.rigidity === "string" && rigidityValues.has(value.rigidity) &&
    isStringArray(value.materials) &&
    isStringArray(value.dominantColors) &&
    typeof value.productShape === "string" &&
    Array.isArray(value.identityCriticalAttributes) &&
    isObject(value.visibleBranding) &&
    Array.isArray(value.interactionTargets) &&
    Array.isArray(value.allowedTransformations) &&
    Array.isArray(value.forbiddenTransformations) &&
    isObject(value.sceneAffinities) &&
    isStringArray(value.sceneAffinities.recommendedSceneTags) &&
    isStringArray(value.sceneAffinities.discouragedSceneTags) &&
    isObject(value.confidence) &&
    typeof value.confidence.overall === "number" &&
    value.confidence.overall >= 0 && value.confidence.overall <= 1 &&
    isObject(value.source) &&
    typeof value.source.model === "string" &&
    typeof value.source.analysisVersion === "string" &&
    typeof value.source.analyzedAt === "string"
  );
}
