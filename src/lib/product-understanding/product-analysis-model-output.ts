import { isSupportedVertical, type SupportedVertical } from "@/lib/verticals/supported-verticals";
import { isProductProfile, PRODUCT_PROFILE_ANALYSIS_VERSION, PRODUCT_PROFILE_SCHEMA_VERSION, type ProductProfile } from "./product-profile";
import type { ProductVerticalAttributes } from "./vertical-attributes";

const nullableString = { type: ["string", "null"] } as const;
const profileSchema = {
  type: "object", additionalProperties: false,
  required: ["vertical", "confidence", "visibleProductCount", "identitySummary", "sourceObservations", "subcategory", "material", "silhouette", "closure", "interactionRules"],
  properties: {
    vertical: { type: "string", enum: ["apparel", "jewelry", "watches", "cosmetics", "footwear", "bags"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    visibleProductCount: { type: "integer", minimum: 1 },
    identitySummary: { type: "array", items: { type: "string" } },
    sourceObservations: { type: "array", items: { type: "string" } },
    subcategory: nullableString, material: nullableString, silhouette: nullableString, closure: nullableString,
    interactionRules: { type: "array", items: { type: "string" } },
  },
} as const;

/** Structured model contract: classification is independent from optional profile observations. */
export const productAnalysisModelOutputSchema = {
  type: "object", additionalProperties: false,
  required: ["status", "vertical", "rawCategory", "subcategory", "unsupportedReason", "profile"],
  properties: {
    status: { type: "string", enum: ["supported", "unsupported", "failed"] },
    vertical: { type: ["string", "null"], enum: ["apparel", "jewelry", "watches", "cosmetics", "footwear", "bags", null] },
    rawCategory: { type: "string" }, subcategory: nullableString, unsupportedReason: { type: "string" },
    profile: { anyOf: [profileSchema, { type: "null" }] },
  },
} as const;

const aliases: Record<SupportedVertical, string[]> = {
  apparel: ["apparel", "clothing", "garment", "fashion apparel", "jacket", "shirt", "trousers", "pants", "hoodie", "sweater", "dress", "fitted dress", "mini dress", "evening dress", "bodycon dress", "coat", "skirt", "top"],
  footwear: ["footwear", "shoe", "shoes", "sneaker", "sneakers", "boot", "boots", "heel", "heels", "sandal", "sandals"],
  bags: ["bag", "bags", "handbag", "backpack", "tote", "clutch", "purse", "crossbody", "satchel"],
  watches: ["watch", "watches", "wristwatch", "timepiece"],
  jewelry: ["jewelry", "jewellery", "ring", "necklace", "earring", "bracelet", "pendant", "chain"],
  cosmetics: ["beauty", "makeup", "skincare", "cosmetic", "cosmetics", "cosmetic bottle"],
};

function normalizeWords(value: string): string {
  return value.toLowerCase().trim().replace(/[_.-]+/g, " ").replace(/\s+/g, " ");
}

export function normalizeProductVertical(...values: unknown[]): SupportedVertical | null {
  for (const value of values) {
    if (typeof value !== "string" || !value.trim()) continue;
    const normalized = normalizeWords(value);
    if (isSupportedVertical(normalized)) return normalized;
    for (const vertical of Object.keys(aliases) as SupportedVertical[]) {
      if (aliases[vertical].some((alias) => normalized === alias || normalized.startsWith(`${alias} `))) return vertical;
    }
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function strings(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function finiteConfidence(value: unknown): number { return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.55; }
function safeText(value: unknown): string | null { return typeof value === "string" && value.trim() ? value.trim().slice(0, 300) : null; }
function interactionTargets(value: unknown): Array<"finger" | "wrist" | "neck" | "ear" | "foot" | "torso" | "hand" | "none"> {
  const allowed = new Set(["finger", "wrist", "neck", "ear", "foot", "torso", "hand", "none"]);
  const values = strings(value).filter((item) => allowed.has(item));
  return values.length ? values as Array<"finger" | "wrist" | "neck" | "ear" | "foot" | "torso" | "hand" | "none"> : ["none"];
}

type ModelProfile = { vertical: SupportedVertical; confidence: number; visibleProductCount: number; identitySummary: string[]; sourceObservations: string[]; subcategory: string | null; material: string | null; silhouette: string | null; closure: string | null; interactionRules: string[] };
export type ProductAnalysisOutputValidation = {
  output: ProductProfile | { status: "unsupported"; inferredCategory: string | null; unsupportedReason: string } | null;
  errorPaths: string[];
  providerSummary?: {
    status: string | null;
    rawVertical: string | null;
    rawCategory: string | null;
    rawSubcategory: string | null;
    hasProfile: boolean;
    confidence: number | null;
  };
};

function profileDetails(vertical: SupportedVertical, model: ModelProfile): ProductVerticalAttributes {
  const subcategory = model.subcategory ?? "unknown";
  switch (vertical) {
    case "apparel": return { vertical, details: { garmentType: subcategory, primaryColor: null, artworkOrLogoLocations: [], closures: model.closure ? [model.closure] : [], pocketStructure: [], hoodOrCollar: null, constructionDetails: model.sourceObservations, identitySides: [] } };
    case "jewelry": return { vertical, details: { jewelryType: subcategory, metalColorOrMaterial: model.material, centerStone: null, centerStoneShape: null, centerStoneColor: null, stoneCount: null, stoneLayout: null, settingStyle: null, bandOrChainStructure: model.silhouette, bodyPlacementTarget: "unknown" } };
    case "watches": return { vertical, details: { caseShape: model.silhouette, caseMaterialOrColor: model.material, dialColor: null, bezel: null, crownSide: "unknown", pushers: null, braceletOrStrap: null, indicesOrMarkers: null, dateWindow: null, subdials: null, dialBrandingRegions: [] } };
    case "cosmetics": return { vertical, details: { packageType: subcategory, packageGeometry: model.silhouette, containerForm: "unknown", closureOrDispenser: "unknown", materialOpacity: "unknown", liquidVisibility: "unknown", labelRegions: [], logoRegions: [] } };
    case "footwear": return { vertical, details: { shoeType: subcategory, silhouette: model.silhouette, upperMaterial: model.material ? [model.material] : [], outsole: null, midsole: null, panelStructure: model.sourceObservations, lacing: null, tongue: null, heel: null, logoRegions: [], colorBlocking: [] } };
    case "bags": return { vertical, details: { bagType: subcategory, silhouette: model.silhouette, proportions: null, bodyStructure: null, handleCount: null, handleGeometry: null, handleAttachmentPoints: [], strapCount: null, strapPlacement: [], strapWidth: null, strapLengthClass: null, closureType: model.closure, flapOrOpeningShape: null, zipperLayout: [], pocketLayout: [], panelConstruction: model.sourceObservations, stitchingPattern: null, pipingOrEdgeTreatment: null, hardwareLayout: [], hardwareColor: null, logoOrMonogramPlacement: [], material: model.material, materialTexture: null, colorBlocking: [], patternOrPrint: null, baseShape: null, baseFeetHardware: null, chainStrap: null, decorativeCharms: [], asymmetricDetails: [] } };
  }
}

function buildProfile(vertical: SupportedVertical, rawProfile: unknown, source: { assetId: string; model: string; analyzedAt: string }, topSubcategory: unknown): ProductProfile | null {
  const profileInput = isRecord(rawProfile) ? rawProfile : {};
  if (normalizeProductVertical(profileInput.vertical) !== vertical) return null;
  const visibleProductCount = typeof profileInput.visibleProductCount === "number" && Number.isInteger(profileInput.visibleProductCount) && profileInput.visibleProductCount > 0 ? profileInput.visibleProductCount : 1;
  const subcategoryValue = profileInput.subcategory === undefined ? topSubcategory : profileInput.subcategory;
  const subcategory = safeText(subcategoryValue);
  const material = safeText(profileInput.material);
  const silhouette = safeText(profileInput.silhouette);
  const closure = safeText(profileInput.closure);
  const identitySummary = strings(profileInput.identitySummary).slice(0, 12);
  const sourceObservations = strings(profileInput.sourceObservations).slice(0, 20);
  const interactionRules = strings(profileInput.interactionRules).slice(0, 12);
  const profile = {
    productId: source.assetId, schemaVersion: PRODUCT_PROFILE_SCHEMA_VERSION, analysisVersion: PRODUCT_PROFILE_ANALYSIS_VERSION,
    vertical, subcategory, wearability: "context_dependent", rigidity: "unknown", materials: material ? [material] : [], dominantColors: [],
    visibleProductCount, identitySummary, sourceObservations, interactionRules,
    productShape: silhouette ?? "unknown", identityCriticalAttributes: identitySummary.map((attribute) => ({ attribute, rationale: "Visible source identity observation.", regions: [] })),
    visibleBranding: { hasLogo: null, hasReadableText: null, hasArtwork: null, logoRegions: [], textRegions: [], artworkRegions: [] },
    interactionTargets: interactionTargets(profileInput.interactionTargets), allowedTransformations: ["perspective_change", "lighting_or_reflection_change"],
    forbiddenTransformations: ["recolor", "logo_movement", "geometry_redesign", "text_or_artwork_change"],
    sceneAffinities: { recommendedSceneTags: [], discouragedSceneTags: [] },
    confidence: { overall: finiteConfidence(profileInput.confidence), fields: { vertical: finiteConfidence(profileInput.confidence) } },
    source: { model: source.model, analysisVersion: PRODUCT_PROFILE_ANALYSIS_VERSION, analyzedAt: source.analyzedAt },
    verticalAttributes: profileDetails(vertical, { vertical, confidence: finiteConfidence(profileInput.confidence), visibleProductCount, identitySummary, sourceObservations, subcategory, material, silhouette, closure, interactionRules }),
  } as unknown;
  return isProductProfile(profile) ? profile : null;
}

export function getProductAnalysisOutputErrorPaths(value: unknown): string[] {
  if (!isRecord(value)) return ["$"];
  if (value.status === "unsupported") {
    const errors: string[] = [];
    if (typeof value.unsupportedReason !== "string" || !value.unsupportedReason.trim()) errors.push("$.unsupportedReason");
    if (typeof value.rawCategory !== "string" || !value.rawCategory.trim()) errors.push("$.rawCategory");
    if (value.profile !== null) errors.push("$.profile");
    return errors;
  }
  if (value.status === "supported") {
    if (!normalizeProductVertical(value.vertical)) return ["$.vertical"];
    if (!isRecord(value.profile)) return ["$.profile"];
    if (normalizeProductVertical(value.profile.vertical) !== normalizeProductVertical(value.vertical)) return ["$.profile.vertical"];
    const errors: string[] = [];
    if (typeof value.profile.confidence !== "number" || !Number.isFinite(value.profile.confidence) || value.profile.confidence < 0 || value.profile.confidence > 1) errors.push("$.profile.confidence");
    if (typeof value.profile.visibleProductCount !== "number" || !Number.isInteger(value.profile.visibleProductCount) || value.profile.visibleProductCount < 1) errors.push("$.profile.visibleProductCount");
    if (!Array.isArray(value.profile.identitySummary) || !value.profile.identitySummary.every((item) => typeof item === "string")) errors.push("$.profile.identitySummary");
    if (!Array.isArray(value.profile.sourceObservations) || !value.profile.sourceObservations.every((item) => typeof item === "string")) errors.push("$.profile.sourceObservations");
    return errors;
  }
  if (value.status === "failed") return ["$.status"];
  if (!["supported", "unsupported", "failed"].includes(String(value.status))) return ["$.status"];
  return [];
}

export function validateProductAnalysisModelOutput(value: unknown, source: { assetId: string; model: string; analyzedAt: string }): ProductAnalysisOutputValidation {
  const semanticErrors = getProductAnalysisOutputErrorPaths(value);
  const legacyFlat = isRecord(value) && value.status === "supported" && "productShape" in value && "confidence" in value;
  const output = semanticErrors.length && !legacyFlat ? null : mapProductAnalysisModelOutput(value, source);
  const record = isRecord(value) ? value : null;
  const rawProfile = record && isRecord(record.profile) ? record.profile : null;
  const paths = getProductAnalysisOutputErrorPaths(value);
  return {
    output,
    errorPaths: output ? [] : paths.length ? paths : ["$.profile"],
    providerSummary: record ? {
      status: typeof record.status === "string" ? record.status : null,
      rawVertical: typeof record.vertical === "string" ? record.vertical.slice(0, 80) : null,
      rawCategory: typeof record.rawCategory === "string" ? record.rawCategory.slice(0, 120) : null,
      rawSubcategory: typeof record.subcategory === "string" ? record.subcategory.slice(0, 120) : null,
      hasProfile: Boolean(rawProfile),
      confidence: typeof rawProfile?.confidence === "number" && Number.isFinite(rawProfile.confidence) ? Math.max(0, Math.min(1, rawProfile.confidence)) : null,
    } : undefined,
  };
}

export function mapProductAnalysisModelOutput(value: unknown, source: { assetId: string; model: string; analyzedAt: string }): ProductProfile | { status: "unsupported"; inferredCategory: string | null; unsupportedReason: string } | null {
  if (!isRecord(value)) return null;
  const rawCategory = typeof value.rawCategory === "string" ? value.rawCategory : typeof value.inferredCategory === "string" ? value.inferredCategory : null;
  const normalized = value.status === "supported"
    ? normalizeProductVertical(value.vertical)
    : normalizeProductVertical(value.vertical, rawCategory, value.subcategory);
  if (value.status === "supported" || value.status === "unsupported" && normalized) {
    if (!normalized) return null;
    if (value.status === "supported" && !isRecord(value.profile) && !("productShape" in value && "confidence" in value)) return null;
    const legacyConfidence = isRecord(value.confidence) ? value.confidence.overall : null;
    const legacyAttributes = Array.isArray(value.identityCriticalAttributes) ? value.identityCriticalAttributes.map((attribute) => isRecord(attribute) ? attribute.attribute : null).filter((attribute): attribute is string => typeof attribute === "string") : [];
    const legacyDetails = value[normalized === "watches" ? "watch" : normalized];
    const legacyProfile = isRecord(value.profile) ? value.profile : {
      vertical: normalized, confidence: legacyConfidence, visibleProductCount: 1, identitySummary: legacyAttributes,
      sourceObservations: isRecord(legacyDetails) ? strings(legacyDetails.constructionDetails ?? legacyDetails.panelStructure) : [],
      subcategory: value.subcategory, material: Array.isArray(value.materials) ? value.materials[0] : null,
      silhouette: value.productShape, closure: null, interactionRules: [], interactionTargets: value.interactionTargets,
    };
    const profile = buildProfile(normalized, legacyProfile, source, value.status === "supported" ? value.subcategory : value.subcategory ?? rawCategory);
    return profile;
  }
  if (value.status === "unsupported") {
    const unsupportedReason = safeText(value.unsupportedReason);
    if (!unsupportedReason || !rawCategory?.trim() || value.profile !== null) return null;
    return { status: "unsupported", inferredCategory: rawCategory, unsupportedReason };
  }
  return null;
}

export function createProductAnalysisInput(input: { assetId: string; image: { data: Buffer; mimeType: string } }) {
  return [{ role: "user" as const, content: [
    { type: "input_text" as const, text: `Analyze product asset ${input.assetId}. Classify first, then describe only visible evidence. A supported vertical does not require a known subcategory or complete details. For supported status, vertical and profile.vertical must match. Return a partial-safe profile with vertical, confidence, visibleProductCount, identitySummary, sourceObservations, and optional material, silhouette, closure, and interactionRules. Use null/empty values for unknown details. Unsupported is only for a truly unusable image or a product clearly outside apparel, jewelry, watches, cosmetics, footwear, and bags, and must include a non-empty unsupportedReason and non-empty attempted rawCategory evidence (for example "unidentified non-product object").` },
    { type: "input_image" as const, image_url: `data:${input.image.mimeType};base64,${input.image.data.toString("base64")}`, detail: "high" as const },
  ] }];
}
