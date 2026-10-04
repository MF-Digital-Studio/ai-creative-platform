import type { ProductPreservationMode } from "../types";
import {
  resolveImageGenerationContext,
  type GenerationVisualCategory,
  type VisualIntent,
} from "../prompts/global-photorealism-policy";
import { isProductProfile, type ProductProfile } from "@/lib/product-understanding/product-profile";

export const generationStrategies = [
  "rigid_product",
  "fashion_on_model",
  "jewelry_still_life",
  "jewelry_on_model",
  "watch_on_wrist",
  "footwear_on_model",
  "reference_edit",
] as const;

export type GenerationStrategy = (typeof generationStrategies)[number];

export function resolveHybridProjectionEligibility(input: {
  vertical: string | null;
  artworkPresent: boolean;
  exactProductApparel: boolean;
  artworkSide: string;
  localized: boolean;
}): boolean {
  return input.vertical === "apparel" && input.artworkPresent && input.exactProductApparel
    && input.localized && (input.artworkSide === "front" || input.artworkSide === "back");
}

export function resolveApparelArtworkCropEligibility(input: { vertical: string | null; exactProductApparel: boolean; artworkPresent: boolean }): boolean {
  return input.vertical === "apparel" && input.exactProductApparel && input.artworkPresent;
}

export type GenerationStrategyReason =
  | "product_profile"
  | "preset_strategy_hint"
  | "structured_product_context"
  | "prompt_intent"
  | "conservative_fallback";

export type GenerationStrategyPreset = {
  generationStrategyHint?: GenerationStrategy;
  id: string;
  useCase?: string | null;
};

export type GenerationProductContext = {
  category?: GenerationVisualCategory | null;
  subjectType?: "on_model" | "still_life" | null;
};

export type GenerationStrategyResolution = {
  effectivePreservationMode: ProductPreservationMode;
  reason: GenerationStrategyReason;
  strategy: GenerationStrategy;
  visualIntent: VisualIntent;
};

export type TrustedReferenceInteraction = "none" | "held" | "worn" | "near_face" | "on_pedestal" | "stacked" | "unknown";

export function getGenerationStrategyCategory(
  strategy: GenerationStrategy,
): GenerationVisualCategory {
  if (strategy === "fashion_on_model") return "apparel";
  if (strategy === "jewelry_on_model" || strategy === "jewelry_still_life") return "jewelry";
  if (strategy === "watch_on_wrist") return "watches";
  if (strategy === "footwear_on_model") return "footwear";
  return "product";
}

const jewelryOnBodyEnglishPattern = /\b(?:on|wearing|worn|around|fit|fitted)\b.{0,56}\b(?:hand|finger|wrist|neck|ear|skin|body|woman|man|model)\b|\b(?:hand|finger|wrist|neck|ear|skin|body)\b.{0,56}\b(?:ring|necklace|earring|bracelet|pendant|jewelry|jewellery)\b/i;
const jewelryOnBodyTurkishPattern = /(?:yüzü(?:k|ğ)|kolye|küpe|bileklik|takı|mücevher).{0,56}(?:parmak|parmağ|elde|elinde|\bel\b|bilek|bileğ|boyun|boyn|kulak|kulağ|cilt|vücut|model)|(?:parmak|parmağ|elde|elinde|\bel\b|bilek|bileğ|boyun|boyn|kulak|kulağ|cilt|vücut|model).{0,56}(?:yüzü(?:k|ğ)|kolye|küpe|bileklik|takı|mücevher)/i;
const onModelFashionIntentPattern = /\b(?:male|female|man|woman|person|fashion)?\s*model\b.{0,80}\b(?:wearing|wear|showing|show|facing)\b|\b(?:put|place|show)\b.{0,32}\b(?:this|the garment|the clothing)\b.{0,32}\b(?:on|with)\b.{0,20}\b(?:a )?model\b/i;

function hasJewelryOnBodyIntent(userPrompt: string): boolean {
  return jewelryOnBodyEnglishPattern.test(userPrompt) || jewelryOnBodyTurkishPattern.test(userPrompt);
}

function effectivePreservationMode(strategy: GenerationStrategy): ProductPreservationMode {
  return strategy === "fashion_on_model" || strategy === "jewelry_on_model" || strategy === "watch_on_wrist" || strategy === "footwear_on_model" || strategy === "reference_edit"
    ? "reference_edit"
    : "pixel_lock";
}

function resolveForCategory(
  category: GenerationVisualCategory,
  userPrompt: string,
  subjectType?: GenerationProductContext["subjectType"],
): GenerationStrategy {
  if (category === "apparel") return "fashion_on_model";
  if (category === "jewelry") {
    if (subjectType === "still_life") return "jewelry_still_life";
    return subjectType === "on_model" || hasJewelryOnBodyIntent(userPrompt)
      ? "jewelry_on_model"
      : "jewelry_still_life";
  }
  if (category === "watches") return subjectType === "on_model" ? "watch_on_wrist" : "rigid_product";
  if (category === "footwear") return subjectType === "on_model" ? "footwear_on_model" : "rigid_product";
  return "rigid_product";
}

function hasOnBodyIntentForTargets(userPrompt: string, targets: ProductProfile["interactionTargets"]): boolean {
  const targetPatterns: Record<ProductProfile["interactionTargets"][number], RegExp> = {
    finger: /\b(?:finger|hand|parmak|elde|elinde)\b/i,
    wrist: /\b(?:wrist|bilek|bileğ)\b/i,
    neck: /\b(?:neck|boyun)\b/i,
    ear: /\b(?:ear|kulak)\b/i,
    foot: /\b(?:foot|feet|shoe|ayak)\b/i,
    torso: /\b(?:torso|body|wearing|model|gövde|vücut|model)\b/i,
    hand: /\b(?:hand|elde|elinde)\b/i,
    none: /$^/,
  };

  return targets.some((target) => targetPatterns[target].test(userPrompt));
}

/**
 * ProductProfile is advisory routing data: it establishes the product vertical
 * and safe physical affordances, while the visible source image remains the
 * fidelity authority for generated pixels.
 */
function resolveForProductProfile(
  profile: ProductProfile,
  userPrompt: string,
  referenceInteraction?: TrustedReferenceInteraction | null,
): GenerationStrategy {
  const canBeWorn = profile.wearability !== "non_wearable" && profile.interactionTargets.some((target) => target !== "none");
  const requestsOnBody = canBeWorn && hasOnBodyIntentForTargets(userPrompt, profile.interactionTargets);

  if (profile.vertical === "apparel") {
    return profile.wearability === "wearable" || profile.rigidity === "deformable"
      ? "fashion_on_model"
      : "rigid_product";
  }
  // Reference analysis may guide pose/interaction, never product identity or vertical.
  const referenceRequestsOnBody = referenceInteraction === "held" || referenceInteraction === "worn";
  if (profile.vertical === "jewelry") return requestsOnBody || (canBeWorn && referenceRequestsOnBody) ? "jewelry_on_model" : "jewelry_still_life";
  if (profile.vertical === "watches") return requestsOnBody ? "watch_on_wrist" : "rigid_product";
  if (profile.vertical === "footwear") return requestsOnBody ? "footwear_on_model" : "rigid_product";
  return "rigid_product";
}

function resolution(
  strategy: GenerationStrategy,
  reason: GenerationStrategyReason,
  visualIntent: VisualIntent,
): GenerationStrategyResolution {
  return {
    effectivePreservationMode: effectivePreservationMode(strategy),
    reason,
    strategy,
    visualIntent,
  };
}

export function resolveGenerationStrategy(input: {
  preset?: GenerationStrategyPreset | null;
  productProfile?: unknown;
  productContext?: GenerationProductContext | null;
  requestedPreservationMode?: ProductPreservationMode | null;
  referenceInteraction?: TrustedReferenceInteraction | null;
  userPrompt: string;
}): GenerationStrategyResolution {
  const context = resolveImageGenerationContext(input.userPrompt, input.preset?.useCase);

  if (isProductProfile(input.productProfile)) {
    return resolution(
      resolveForProductProfile(input.productProfile, input.userPrompt, input.referenceInteraction),
      "product_profile",
      context.visualIntent,
    );
  }

  if (input.preset?.generationStrategyHint) {
    return resolution(input.preset.generationStrategyHint, "preset_strategy_hint", context.visualIntent);
  }

  if (input.productContext?.category) {
    return resolution(
      resolveForCategory(
        input.productContext.category,
        input.userPrompt,
        input.productContext.subjectType,
      ),
      "structured_product_context",
      context.visualIntent,
    );
  }

  if (context.category !== "product") {
    return resolution(
      resolveForCategory(context.category, input.userPrompt),
      "prompt_intent",
      context.visualIntent,
    );
  }

  if (onModelFashionIntentPattern.test(input.userPrompt)) {
    return resolution("fashion_on_model", "prompt_intent", context.visualIntent);
  }

  return resolution("rigid_product", "conservative_fallback", context.visualIntent);
}
