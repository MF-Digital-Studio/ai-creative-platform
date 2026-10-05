import type { GenerationStrategy } from "@/lib/generation/strategy/generation-strategy";
import type { ProductProfile } from "@/lib/product-understanding/product-profile";
import type { SupportedVertical } from "@/lib/verticals/supported-verticals";

export const SCENE_SUITABILITY_VERSION = "scene-suitability-v1";

export const sceneFamilies = [
  "apparel_studio", "apparel_street", "apparel_location_editorial", "apparel_detail",
  "jewelry_on_body", "jewelry_studio", "jewelry_macro_still_life", "jewelry_aesthetic_surface",
  "watch_on_wrist", "watch_studio", "watch_lifestyle_surface", "watch_macro_detail",
  "cosmetics_studio", "cosmetics_vanity", "cosmetics_lifestyle", "cosmetics_aesthetic_surface", "cosmetics_macro",
  "footwear_on_foot", "footwear_studio", "footwear_street", "footwear_aesthetic_location", "footwear_detail",
  "bags_handheld", "bags_shoulder_carry", "bags_crossbody", "bags_under_arm", "bags_tabletop", "bags_furniture", "bags_luxury_still_life", "bags_street_editorial", "bags_travel_lifestyle", "bags_studio",
] as const;

export type SceneFamily = (typeof sceneFamilies)[number];
export type SceneSuitabilitySource = "explicit_user_intent" | "trusted_preset" | "product_profile" | "strategy_default" | "vertical_default";
export type SceneSuitabilityConfidence = "high" | "medium" | "low";

export type SceneSuitabilityPreset = {
  id: string;
  vertical?: SupportedVertical | "product" | null;
};

export type SceneSuitabilityResolution = {
  selectedSceneFamily: SceneFamily;
  suitableSceneFamilies: readonly SceneFamily[];
  avoidedSceneFamilies: readonly SceneFamily[];
  reason: string;
  confidence: SceneSuitabilityConfidence;
  source: SceneSuitabilitySource;
};

export type ResolveSceneSuitabilityInput = {
  productProfile?: ProductProfile | null;
  preset?: SceneSuitabilityPreset | null;
  strategy?: GenerationStrategy | null;
  userPrompt: string;
  vertical?: SupportedVertical | null;
};
