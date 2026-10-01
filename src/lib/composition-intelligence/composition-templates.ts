import type { CompositionProfile } from "./types";

type Template = Omit<CompositionProfile, "source" | "version">;

const hero = (framing: Template["framing"], scale: Template["subjectScale"], distance: Template["cameraDistance"], angle: Template["preferredAngle"], depthOfField: Template["depthOfField"], rules: readonly string[]): Template => ({ framing, subjectScale: scale, productDominance: "hero", cameraDistance: distance, preferredAngle: angle, depthOfField, negativeCompositionRules: rules });
const primary = (framing: Template["framing"], scale: Template["subjectScale"], distance: Template["cameraDistance"], angle: Template["preferredAngle"], depthOfField: Template["depthOfField"], rules: readonly string[]): Template => ({ framing, subjectScale: scale, productDominance: "primary", cameraDistance: distance, preferredAngle: angle, depthOfField, negativeCompositionRules: rules });

export const compositionTemplates = {
  apparel_studio: primary("full_product", "large", "medium", "eye_level", "moderate", ["Do not crop key garment artwork, closures, or silhouette."]),
  apparel_street: primary("medium", "large", "medium", "eye_level", "moderate", ["Do not let the environment dominate the garment."]),
  apparel_location_editorial: primary("environmental", "medium", "medium", "eye_level", "deep", ["Do not make the garment secondary in a cinematic wide shot."]),
  apparel_detail: hero("close_up", "large", "close", "product_level", "shallow_product_locked", ["Do not hide identity-critical garment regions without explicit detail intent."]),
  jewelry_on_body: hero("close_up", "large", "close", "eye_level", "shallow_product_locked", ["Do not use full-body or wide environmental framing.", "Do not let the supporting body part dominate the jewelry.", "Do not blur the jewelry."]),
  jewelry_studio: hero("close_up", "large", "close", "three_quarter", "moderate", ["Do not use excessive props or empty environment."]),
  jewelry_macro_still_life: hero("macro", "extreme_close", "macro", "product_level", "shallow_product_locked", ["Do not obscure the complete product silhouette."]),
  jewelry_aesthetic_surface: hero("close_up", "large", "close", "elevated", "moderate", ["Do not let decorative surfaces dominate the jewelry."]),
  watch_on_wrist: hero("close_up", "large", "close", "eye_level", "shallow_product_locked", ["Do not use portrait-first or full-body framing.", "Do not hide the dial, case, or important crown side."]),
  watch_studio: hero("full_product", "large", "close", "three_quarter", "moderate", ["Do not make the watch tiny in empty space."]),
  watch_lifestyle_surface: primary("medium_close", "large", "close", "three_quarter", "moderate", ["Do not clutter or obscure the dial with props."]),
  watch_macro_detail: hero("macro", "extreme_close", "macro", "product_level", "shallow_product_locked", ["Do not crop identity-critical watch structures accidentally."]),
  cosmetics_studio: hero("full_product", "large", "close", "product_level", "moderate", ["Do not hide label or logo regions."]),
  cosmetics_vanity: primary("medium_close", "large", "close", "elevated", "moderate", ["Do not let vanity props cover the package."]),
  cosmetics_lifestyle: primary("medium_close", "large", "close", "eye_level", "moderate", ["Do not make packaging secondary to a person or environment."]),
  cosmetics_aesthetic_surface: hero("close_up", "large", "close", "elevated", "moderate", ["Do not let decorative props dominate the product."]),
  cosmetics_macro: hero("macro", "extreme_close", "macro", "product_level", "shallow_product_locked", ["Keep package identity recognizable, not only texture."]),
  footwear_on_foot: hero("medium_close", "large", "medium", "low", "moderate", ["Do not make the upper body dominant.", "Do not make the footwear tiny."]),
  footwear_studio: hero("full_product", "large", "close", "three_quarter", "moderate", ["Do not use excessive empty space."]),
  footwear_street: primary("medium_close", "large", "medium", "low", "moderate", ["Keep the street contextual and the footwear inspectable."]),
  footwear_aesthetic_location: primary("medium", "large", "medium", "low", "moderate", ["Do not let the location become the hero."]),
  footwear_detail: hero("close_up", "large", "close", "product_level", "shallow_product_locked", ["Do not lose the footwear silhouette completely."]),
} as const;
