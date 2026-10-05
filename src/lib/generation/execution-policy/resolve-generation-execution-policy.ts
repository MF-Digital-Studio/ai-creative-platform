import type { ProductProfile } from "@/lib/product-understanding/product-profile";
import { GENERATION_EXECUTION_POLICY_VERSION } from "./execution-policy-version";
import type { GenerationExecutionPolicy, GenerationExecutionReason } from "./types";
import type { GenerationStrategy } from "@/lib/generation/strategy/generation-strategy";

export function resolveGenerationExecutionPolicy(input: {
  productProfile: ProductProfile | null;
  hasReference: boolean;
  referenceReplacement: boolean;
  exactProduct: boolean;
  artworkLocalized: boolean;
  presetConfidence: "high" | "medium" | "low";
  hasCustomNote: boolean;
  ambiguousNote: boolean;
  strategy?: GenerationStrategy;
  artworkComplexity?: "simple_logo" | "complex_artwork" | "none";
}): GenerationExecutionPolicy {
  const profile = input.productProfile;
  const reasons: GenerationExecutionReason[] = [];
  const watch = profile?.vertical === "watches";
  const artworkText = !watch && (input.artworkComplexity === "complex_artwork" || input.artworkComplexity !== "simple_logo" && Boolean(profile?.visibleBranding.hasReadableText || profile?.visibleBranding.hasLogo || profile?.visibleBranding.hasArtwork));
  const jewelry = profile?.vertical === "jewelry";
  const onModelApparel = profile?.vertical === "apparel" && input.strategy === "fashion_on_model";
  const complexOnModelFootwear = profile?.vertical === "footwear" && input.strategy === "footwear_on_model";
  const onModelBag = profile?.vertical === "bags" && input.strategy === "bags_on_model";
  const identityCriticalBag = profile?.vertical === "bags" && Boolean(profile.visibleBranding.hasLogo || profile.visibleBranding.hasReadableText);
  const exactProductHighRisk = input.exactProduct && !(profile?.vertical === "apparel" && input.artworkComplexity === "simple_logo");
  const complex = Boolean(onModelApparel && input.artworkComplexity !== "simple_logo" || artworkText || jewelry || watch || input.referenceReplacement || exactProductHighRisk || complexOnModelFootwear || onModelBag || identityCriticalBag);
  if (artworkText) reasons.push("artwork_text");
  if (input.exactProduct) reasons.push("exact_product");
  if (input.artworkComplexity === "simple_logo") reasons.push("simple_logo");
  if (jewelry) reasons.push("jewelry_geometry");
  if (watch) reasons.push("watch_geometry", "watch_dial_detail", "identity_critical");
  if (onModelBag || identityCriticalBag) reasons.push("identity_critical");
  if (input.referenceReplacement) reasons.push("reference_replacement");
  if (profile?.vertical === "apparel" && !onModelApparel && !artworkText && !input.exactProduct) reasons.push("plain_apparel");
  if (!complex && profile && ["cosmetics", "product", "home_goods"].includes(profile.vertical)) reasons.push("simple_still_life");
  if (!reasons.length && profile) reasons.push("detailed_product");
  const promptEnhancement = input.hasCustomNote || input.ambiguousNote || input.presetConfidence !== "high" || input.hasReference;
  return {
    version: GENERATION_EXECUTION_POLICY_VERSION,
    quality: complex ? "xhigh" : "high",
    difficulty: complex ? "high" : "medium",
    reasons,
    promptEnhancement,
    validationRequired: true,
    repairEligible: true,
    repairQuality: "xhigh",
    reuseCachedAnalysis: true,
    parallelizablePreprocessing: ["product_profile_load", "reference_metadata_load", "preset_metadata_load"],
  };
}
