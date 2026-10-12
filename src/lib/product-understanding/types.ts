import type { SupportedVertical } from "@/lib/verticals/supported-verticals";

import type { ProductRegion, ProductVerticalAttributes } from "./vertical-attributes";

export type ProductWearability = "wearable" | "non_wearable" | "context_dependent";
export type ProductRigidity = "rigid" | "semi_rigid" | "deformable" | "unknown";
export type ProductInteractionTarget =
  | "finger"
  | "wrist"
  | "neck"
  | "ear"
  | "foot"
  | "torso"
  | "hand"
  | "none";

export type ProductTransformation =
  | "natural_fabric_deformation"
  | "perspective_change"
  | "lighting_or_reflection_change"
  | "body_fitting"
  | "natural_pose_flex"
  | "none";

export type ForbiddenProductTransformation =
  | "recolor"
  | "logo_movement"
  | "geometry_redesign"
  | "gemstone_count_change"
  | "dial_layout_change"
  | "outsole_redesign"
  | "label_redesign"
  | "text_or_artwork_change"
  | "packaging_redesign";

export type IdentityCriticalAttribute = {
  attribute: string;
  rationale: string;
  regions: ProductRegion[];
};

export type VisibleBranding = {
  hasLogo: boolean | null;
  hasReadableText: boolean | null;
  hasArtwork: boolean | null;
  logoRegions: ProductRegion[];
  textRegions: ProductRegion[];
  artworkRegions: ProductRegion[];
};

export type ProductProfileConfidence = {
  overall: number;
  fields?: Partial<Record<
    | "vertical"
    | "subcategory"
    | "materials"
    | "wearability"
    | "rigidity"
    | "visibleBranding"
    | "verticalAttributes", number
  >>;
};

export type ProductProfileSource = {
  model: string;
  analysisVersion: string;
  analyzedAt: string;
};

type ProductProfileBase = {
  productId: string;
  schemaVersion: number;
  analysisVersion: string;
  vertical: SupportedVertical;
  subcategory: string | null;
  wearability: ProductWearability;
  rigidity: ProductRigidity;
  materials: string[];
  dominantColors: string[];
  productShape: string;
  identityCriticalAttributes: IdentityCriticalAttribute[];
  visibleBranding: VisibleBranding;
  interactionTargets: ProductInteractionTarget[];
  allowedTransformations: ProductTransformation[];
  forbiddenTransformations: ForbiddenProductTransformation[];
  sceneAffinities: {
    recommendedSceneTags: string[];
    discouragedSceneTags: string[];
  };
  confidence: ProductProfileConfidence;
  source: ProductProfileSource;
  /** Stable visual evidence retained by V3; optional for historical profile compatibility. */
  visibleProductCount?: number;
  identitySummary?: string[];
  sourceObservations?: string[];
  interactionRules?: string[];
};

export type ProductProfile = ProductProfileBase & {
  verticalAttributes: ProductVerticalAttributes;
};
