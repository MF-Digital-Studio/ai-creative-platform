import type { GenerationStrategy } from "@/lib/generation/strategy/generation-strategy";
import type { ReferenceStyleBrief } from "@/lib/generation/references/reference-style-brief";
import type { ProductProfile } from "@/lib/product-understanding/product-profile";
import type { SceneFamily } from "@/lib/scene-suitability/types";

export const COMPOSITION_INTELLIGENCE_VERSION = "composition-intelligence-v1";

export type CompositionFraming = "macro" | "close_up" | "medium_close" | "medium" | "full_product" | "environmental";
export type CompositionSubjectScale = "extreme_close" | "large" | "medium" | "contextual";
export type CompositionProductDominance = "hero" | "primary" | "balanced";
export type CompositionCameraDistance = "macro" | "close" | "medium";
export type CompositionPreferredAngle = "eye_level" | "three_quarter" | "low" | "elevated" | "product_level";
export type CompositionDepthOfField = "shallow_product_locked" | "moderate" | "deep";
export type CompositionSource = "scene_template" | "explicit_user_intent" | "preset_hint" | "reference_style" | "safe_fallback";

export type CompositionProfile = {
  framing: CompositionFraming;
  subjectScale: CompositionSubjectScale;
  productDominance: CompositionProductDominance;
  cameraDistance: CompositionCameraDistance;
  preferredAngle: CompositionPreferredAngle;
  depthOfField: CompositionDepthOfField;
  negativeCompositionRules: readonly string[];
  source: CompositionSource;
  version: typeof COMPOSITION_INTELLIGENCE_VERSION;
};

export type ResolveCompositionInput = {
  productProfile?: ProductProfile | null;
  sceneFamily?: SceneFamily | null;
  strategy?: GenerationStrategy | null;
  userPrompt: string;
  referenceStyle?: ReferenceStyleBrief | null;
  presetId?: string | null;
};
