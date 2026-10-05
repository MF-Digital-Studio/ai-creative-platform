import { isProductProfile } from "@/lib/product-understanding/product-profile";
import type { SceneFamily } from "@/lib/scene-suitability/types";

import { compositionTemplates } from "./composition-templates";
import { COMPOSITION_INTELLIGENCE_VERSION, type CompositionProfile, type ResolveCompositionInput } from "./types";

function has(prompt: string, pattern: RegExp): boolean { return pattern.test(prompt); }

function safeFallback(input: ResolveCompositionInput): SceneFamily | null {
  if (isProductProfile(input.productProfile)) {
    const byVertical = { apparel: "apparel_studio", jewelry: "jewelry_studio", watches: "watch_studio", cosmetics: "cosmetics_studio", footwear: "footwear_studio", bags: "bags_studio" } as const;
    return byVertical[input.productProfile.vertical];
  }
  if (input.strategy === "jewelry_on_model") return "jewelry_on_body";
  if (input.strategy === "watch_on_wrist") return "watch_on_wrist";
  if (input.strategy === "footwear_on_model") return "footwear_on_foot";
  if (input.strategy === "fashion_on_model") return "apparel_studio";
  return null;
}

export function resolveComposition(input: ResolveCompositionInput): CompositionProfile | null {
  const family = input.sceneFamily ?? safeFallback(input);
  if (!family) return null;
  const template = compositionTemplates[family];
  const prompt = input.userPrompt;
  const macro = has(prompt, /\b(?:macro|close-up|yakın plan|detay)\b/i);
  const close = has(prompt, /\b(?:close[- ]?up|yakın plan)\b/i);
  const unsafeWide = has(prompt, /\b(?:full body|wide shot|geniş|sinematik)\b/i);
  const referenceClose = input.referenceStyle && /macro|close/i.test(`${input.referenceStyle.composition.framing} ${input.referenceStyle.composition.cameraDistance}`);
  const canUseMacro = family.endsWith("macro_still_life") || family.endsWith("macro_detail") || family.endsWith("_detail") || family === "jewelry_studio" || family === "watch_studio" || family === "cosmetics_studio" || family === "footwear_studio";
  const source = macro && canUseMacro ? "explicit_user_intent" : referenceClose && canUseMacro ? "reference_style" : input.presetId ? "preset_hint" : input.sceneFamily ? "scene_template" : "safe_fallback";
  const profile: CompositionProfile = { ...template, source, version: COMPOSITION_INTELLIGENCE_VERSION };
  if ((macro || referenceClose) && canUseMacro) return { ...profile, framing: "macro", subjectScale: "extreme_close", cameraDistance: "macro", depthOfField: "shallow_product_locked" };
  if (close && profile.framing === "medium") return { ...profile, framing: "medium_close", cameraDistance: "close", source: "explicit_user_intent" };
  // Wide/full-body wording is intentionally ignored for small product families.
  if (unsafeWide && (family.startsWith("jewelry_") || family === "watch_on_wrist")) return profile;
  return profile;
}
