import { isProductProfile } from "@/lib/product-understanding/product-profile";
import type { ProductProfile } from "@/lib/product-understanding/product-profile";
import type { SupportedVertical } from "@/lib/verticals/supported-verticals";

import { sceneFamiliesByVertical } from "./scene-families";
import type { ResolveSceneSuitabilityInput, SceneFamily, SceneSuitabilityResolution } from "./types";
import { getReferenceShotProfile } from "@/lib/generation/references/reference-shot-profile";

type Intent = "hand" | "wrist" | "studio" | "street" | "macro" | "on_foot" | "location" | "vanity" | "detail" | "crossbody" | "shoulder" | "tabletop" | "travel";

const intentPatterns: ReadonlyArray<readonly [Intent, RegExp]> = [
  ["hand", /\b(?:hand|finger|elde|elinde|parmak(?:ta|ında|ta)?)\b/i],
  ["wrist", /\b(?:wrist|bilek(?:te)?|bileğ(?:inde|i|e)?)\b/i],
  ["studio", /\b(?:studio|stüdyo|product shot|ürün çekimi)\b/i],
  ["street", /\b(?:street|sokak(?:ta)?|urban|şehir(?:de)?)\b/i],
  ["macro", /\b(?:macro|close-up|yakın plan|detay)\b/i],
  ["on_foot", /\b(?:on foot|wearing the shoes|ayağında|giyilmiş)\b/i],
  ["location", /\b(?:location|outdoor|exterior|mekan(?:da)?|dış mekan)\b/i],
  ["vanity", /\b(?:vanity|makyaj masası|bathroom|banyo)\b/i],
  ["detail", /\b(?:detail|detay|close-up|yakın plan)\b/i],
];

const presetFamilies: Readonly<Record<string, SceneFamily>> = {
  "apparel-street": "apparel_street", "apparel-studio": "apparel_studio", "apparel-scenic": "apparel_location_editorial",
  "jewelry-on-model": "jewelry_on_body", "jewelry-lifestyle": "jewelry_aesthetic_surface", "jewelry-studio": "jewelry_studio",
  "watches-on-wrist": "watch_on_wrist", "watches-product-composition": "watch_lifestyle_surface", "watches-editorial-studio": "watch_studio",
  "footwear-street": "footwear_street", "footwear-studio": "footwear_studio", "footwear-scenic": "footwear_aesthetic_location",
  "cosmetics-scenic": "cosmetics_lifestyle",
  "bags-on-model": "bags_handheld", "bags-studio": "bags_studio", "bags-lifestyle": "bags_furniture",
  "apparel-street-style": "apparel_street", "apparel-scenic-editorial": "apparel_location_editorial", "apparel-studio-style": "apparel_studio",
  "jewelry-on-body": "jewelry_on_body", "jewelry-scenic": "jewelry_aesthetic_surface",
  "watch-on-wrist": "watch_on_wrist", "watch-bright-studio": "watch_studio", "watch-scenic-environment": "watch_lifestyle_surface",
  "footwear-hero-focus": "footwear_detail", "footwear-street-lifestyle": "footwear_street",
  "cosmetics-aesthetic-setting": "cosmetics_vanity", "cosmetics-lifestyle-landscape": "cosmetics_lifestyle",
  "bags-street-editorial": "bags_street_editorial", "bags-minimal-studio": "bags_studio", "bags-crossbody-lifestyle": "bags_crossbody",
};

const sceneTypesByFamily: Readonly<Record<SceneFamily, readonly string[]>> = {
  apparel_studio: ["controlled_product_studio"], apparel_street: ["urban_street", "human_interaction", "editorial_lifestyle"], apparel_location_editorial: ["human_interaction", "editorial_lifestyle", "human_free_editorial_environment"], apparel_detail: ["controlled_product_studio"],
  jewelry_on_body: ["human_interaction", "editorial_lifestyle"], jewelry_studio: ["controlled_product_studio"], jewelry_macro_still_life: ["controlled_product_studio"], jewelry_aesthetic_surface: ["human_free_editorial_environment"],
  watch_on_wrist: ["human_interaction", "editorial_lifestyle"], watch_studio: ["controlled_product_studio"], watch_lifestyle_surface: ["human_free_editorial_environment"], watch_macro_detail: ["controlled_product_studio"],
  cosmetics_studio: ["controlled_product_studio"], cosmetics_vanity: ["human_free_editorial_environment"], cosmetics_lifestyle: ["human_free_editorial_environment"], cosmetics_aesthetic_surface: ["human_free_editorial_environment"], cosmetics_macro: ["controlled_product_studio"],
  footwear_on_foot: ["human_interaction", "editorial_lifestyle"], footwear_studio: ["controlled_product_studio"], footwear_street: ["urban_street", "human_interaction", "editorial_lifestyle"], footwear_aesthetic_location: ["human_free_editorial_environment"], footwear_detail: ["controlled_product_studio"],
  bags_handheld: ["human_interaction", "editorial_lifestyle"], bags_shoulder_carry: ["human_interaction", "editorial_lifestyle"], bags_crossbody: ["human_interaction", "editorial_lifestyle"], bags_under_arm: ["human_interaction", "editorial_lifestyle"], bags_tabletop: ["human_free_editorial_environment"], bags_furniture: ["human_free_editorial_environment"], bags_luxury_still_life: ["controlled_product_studio"], bags_street_editorial: ["urban_street", "human_interaction", "editorial_lifestyle"], bags_travel_lifestyle: ["human_free_editorial_environment"], bags_studio: ["controlled_product_studio"],
};

function sceneTypeAllowed(family: SceneFamily, allowed: readonly string[] | undefined, disallowed: readonly string[] | undefined): boolean {
  const types = sceneTypesByFamily[family];
  if (disallowed?.some((type) => types.includes(type))) return false;
  return !allowed?.length || allowed.some((type) => types.includes(type));
}

function intentsFrom(prompt: string): Set<Intent> {
  const intents = new Set(intentPatterns.filter(([, pattern]) => pattern.test(prompt)).map(([intent]) => intent));
  if (/crossbody|cross-body|cross body/i.test(prompt)) intents.add("crossbody");
  if (/shoulder carry|on shoulder|shoulder bag/i.test(prompt)) intents.add("shoulder");
  if (/tabletop|table top/i.test(prompt)) intents.add("tabletop");
  if (/travel|commute/i.test(prompt)) intents.add("travel");
  return intents;
}

function verticalFrom(input: ResolveSceneSuitabilityInput): SupportedVertical | null {
  if (isProductProfile(input.productProfile)) return input.productProfile.vertical;
  return input.vertical ?? null;
}

function subcategory(profile: ProductProfile): string {
  const attributeType = profile.verticalAttributes.details;
  const fallback = "jewelryType" in attributeType ? attributeType.jewelryType : "";
  return `${profile.subcategory ?? ""} ${fallback}`.toLowerCase();
}

function profilePriority(profile: ProductProfile): readonly SceneFamily[] {
  switch (profile.vertical) {
    case "jewelry": {
      const type = subcategory(profile);
      if (type.includes("ring") || profile.interactionTargets.includes("finger")) return ["jewelry_on_body", "jewelry_macro_still_life", "jewelry_studio", "jewelry_aesthetic_surface"];
      if (type.includes("necklace") || profile.interactionTargets.includes("neck")) return ["jewelry_on_body", "jewelry_studio", "jewelry_macro_still_life", "jewelry_aesthetic_surface"];
      if (type.includes("bracelet") || profile.interactionTargets.includes("wrist")) return ["jewelry_on_body", "jewelry_studio", "jewelry_macro_still_life", "jewelry_aesthetic_surface"];
      if (type.includes("earring") || profile.interactionTargets.includes("ear")) return ["jewelry_on_body", "jewelry_studio", "jewelry_macro_still_life", "jewelry_aesthetic_surface"];
      return ["jewelry_studio", "jewelry_macro_still_life", "jewelry_aesthetic_surface", "jewelry_on_body"];
    }
    case "watches": return ["watch_studio", "watch_on_wrist", "watch_lifestyle_surface", "watch_macro_detail"];
    case "footwear": return ["footwear_studio", "footwear_on_foot", "footwear_street", "footwear_detail", "footwear_aesthetic_location"];
    case "apparel": return ["apparel_studio", "apparel_street", "apparel_location_editorial", "apparel_detail"];
    case "cosmetics": return ["cosmetics_studio", "cosmetics_aesthetic_surface", "cosmetics_lifestyle", "cosmetics_vanity", "cosmetics_macro"];
    case "bags": return ["bags_studio", "bags_handheld", "bags_shoulder_carry", "bags_crossbody", "bags_under_arm", "bags_tabletop", "bags_luxury_still_life", "bags_street_editorial", "bags_travel_lifestyle", "bags_furniture"];
  }
}

function intentFamily(vertical: SupportedVertical, intents: Set<Intent>, profile: ProductProfile | null): SceneFamily | null {
  if (vertical === "jewelry") {
    if (intents.has("hand") && profile?.interactionTargets.some((target) => target === "finger" || target === "hand")) return "jewelry_on_body";
    if (intents.has("macro") || intents.has("detail")) return "jewelry_macro_still_life";
    if (intents.has("studio")) return "jewelry_studio";
  }
  if (vertical === "watches") {
    if (intents.has("wrist") && (profile?.interactionTargets.includes("wrist") ?? true)) return "watch_on_wrist";
    if (intents.has("macro") || intents.has("detail")) return "watch_macro_detail";
    if (intents.has("studio")) return "watch_studio";
  }
  if (vertical === "footwear") {
    if (intents.has("on_foot")) return intents.has("street") ? "footwear_street" : "footwear_on_foot";
    if (intents.has("street")) return "footwear_street";
    if (intents.has("studio")) return "footwear_studio";
    if (intents.has("macro") || intents.has("detail")) return "footwear_detail";
    if (intents.has("location")) return "footwear_aesthetic_location";
  }
  if (vertical === "apparel") {
    if (intents.has("street")) return "apparel_street";
    if (intents.has("location")) return "apparel_location_editorial";
    if (intents.has("detail")) return "apparel_detail";
    if (intents.has("studio")) return "apparel_studio";
  }
  if (vertical === "cosmetics") {
    if (intents.has("vanity")) return "cosmetics_vanity";
    if (intents.has("macro") || intents.has("detail")) return "cosmetics_macro";
    if (intents.has("location")) return "cosmetics_lifestyle";
    if (intents.has("studio")) return "cosmetics_studio";
  }
  if (vertical === "bags") {
    if (intents.has("crossbody")) return "bags_crossbody";
    if (intents.has("shoulder")) return "bags_shoulder_carry";
    if (intents.has("hand")) return "bags_handheld";
    if (intents.has("tabletop")) return "bags_tabletop";
    if (intents.has("travel")) return "bags_travel_lifestyle";
    if (intents.has("macro") || intents.has("detail")) return "bags_luxury_still_life";
    if (intents.has("street")) return "bags_street_editorial";
    if (intents.has("studio")) return "bags_studio";
    if (intents.has("location")) return "bags_travel_lifestyle";
  }
  return null;
}

function strategyFamily(vertical: SupportedVertical, strategy: ResolveSceneSuitabilityInput["strategy"]): SceneFamily | null {
  if (strategy === "jewelry_on_model") return vertical === "jewelry" ? "jewelry_on_body" : null;
  if (strategy === "jewelry_still_life") return vertical === "jewelry" ? "jewelry_studio" : null;
  if (strategy === "watch_on_wrist") return vertical === "watches" ? "watch_on_wrist" : null;
  if (strategy === "footwear_on_model") return vertical === "footwear" ? "footwear_on_foot" : null;
  if (strategy === "bags_on_model") return vertical === "bags" ? "bags_handheld" : null;
  if (strategy === "fashion_on_model") return vertical === "apparel" ? "apparel_studio" : null;
  return null;
}

function referenceFamily(vertical: SupportedVertical, input: ResolveSceneSuitabilityInput): SceneFamily | null {
  if (!input.reference) return null;
  const shot = getReferenceShotProfile(input.reference);
  const text = `${shot.background ?? ""} ${shot.environment ?? ""} ${shot.compositionNotes ?? ""}`;
  const human = shot.interaction === "held" || shot.interaction === "worn" || shot.interaction === "near_face" || Boolean(shot.humanPose);
  const street = shot.background === "street" || /street|urban|sidewalk|city|outdoor/i.test(text);
  const studio = shot.background === "seamless_studio" || shot.background === "solid_color" || shot.background === "gradient_backdrop" || /studio|seamless/i.test(text);
  if (vertical === "apparel") return street ? "apparel_street" : studio ? "apparel_studio" : "apparel_location_editorial";
  if (vertical === "jewelry") return human ? "jewelry_on_body" : studio ? "jewelry_studio" : "jewelry_aesthetic_surface";
  if (vertical === "watches") return human ? "watch_on_wrist" : studio ? "watch_studio" : "watch_lifestyle_surface";
  if (vertical === "footwear") return street ? "footwear_street" : human ? "footwear_on_foot" : studio ? "footwear_studio" : "footwear_aesthetic_location";
  if (vertical === "cosmetics") return studio ? "cosmetics_studio" : shot.background === "vanity" ? "cosmetics_vanity" : "cosmetics_lifestyle";
  if (vertical === "bags") return street ? "bags_street_editorial" : human ? "bags_handheld" : studio ? "bags_studio" : "bags_furniture";
  return null;
}

export function resolveSceneSuitability(input: ResolveSceneSuitabilityInput): SceneSuitabilityResolution | null {
  const vertical = verticalFrom(input);
  if (!vertical) return null;
  if (input.strictProductOnlyStudio && vertical === "apparel") {
    const selectedSceneFamily: SceneFamily = "apparel_studio";
    return {
      selectedSceneFamily,
      suitableSceneFamilies: [selectedSceneFamily],
      avoidedSceneFamilies: sceneFamiliesByVertical.apparel.filter((family) => family !== selectedSceneFamily),
      reason: "binding product-only Apparel Studio presentation suppresses conflicting scene and reference authority",
      confidence: "high",
      source: "trusted_preset",
    };
  }
  const profile = isProductProfile(input.productProfile) ? input.productProfile : null;
  const verticalSuitable = profile ? profilePriority(profile) : sceneFamiliesByVertical[vertical];
  const suitable = input.referenceAuthority
    ? verticalSuitable
    : verticalSuitable.filter((family) => sceneTypeAllowed(family, input.preset?.allowedSceneTypes, input.preset?.disallowedSceneTypes));
  const effectiveSuitable = suitable.length ? suitable : verticalSuitable;
  const avoided = Object.values(sceneFamiliesByVertical).flat().filter((family) => !effectiveSuitable.includes(family));
  const preset = input.preset ? presetFamilies[input.preset.id] : null;
  const presetCompatible = preset && effectiveSuitable.includes(preset);
  const intent = intentFamily(vertical, intentsFrom(input.userPrompt), profile);
  if (presetCompatible && input.presetAuthority === "strong" && !(vertical === "bags" && (intentsFrom(input.userPrompt).has("crossbody") || intentsFrom(input.userPrompt).has("shoulder") || intentsFrom(input.userPrompt).has("hand")))) return { selectedSceneFamily: preset, suitableSceneFamilies: effectiveSuitable, avoidedSceneFamilies: avoided, reason: "selected preset family is authoritative for preset-only generation", confidence: "high", source: "trusted_preset" };
  if (intent && (input.presetAuthority === "supporting" || sceneTypeAllowed(intent, input.preset?.allowedSceneTypes, input.preset?.disallowedSceneTypes))) return { selectedSceneFamily: intent, suitableSceneFamilies: effectiveSuitable, avoidedSceneFamilies: avoided, reason: "compatible explicit user scene intent", confidence: "high", source: "explicit_user_intent" };
  const reference = input.referenceAuthority ? referenceFamily(vertical, input) : null;
  if (reference && effectiveSuitable.includes(reference)) return { selectedSceneFamily: reference, suitableSceneFamilies: effectiveSuitable, avoidedSceneFamilies: avoided, reason: "Reference 1 is authoritative for scene and composition", confidence: "high", source: "reference_authority" };
  if (input.referenceAuthority && !input.reference) return { selectedSceneFamily: effectiveSuitable[0], suitableSceneFamilies: effectiveSuitable, avoidedSceneFamilies: avoided, reason: "Reference 1 remains scene authority; structured analysis was unavailable and generic preset filtering was bypassed", confidence: "low", source: "reference_authority" };
  if (presetCompatible) return { selectedSceneFamily: preset, suitableSceneFamilies: effectiveSuitable, avoidedSceneFamilies: avoided, reason: "trusted preset scene intent", confidence: "high", source: "trusted_preset" };
  if (profile) return { selectedSceneFamily: effectiveSuitable[0], suitableSceneFamilies: effectiveSuitable, avoidedSceneFamilies: avoided, reason: "ProductProfile physical interaction and subcategory evidence", confidence: "high", source: "product_profile" };
  const strategy = strategyFamily(vertical, input.strategy);
  if (strategy && effectiveSuitable.includes(strategy)) return { selectedSceneFamily: strategy, suitableSceneFamilies: effectiveSuitable, avoidedSceneFamilies: avoided, reason: "resolved generation strategy", confidence: "medium", source: "strategy_default" };
  return { selectedSceneFamily: effectiveSuitable[0], suitableSceneFamilies: effectiveSuitable, avoidedSceneFamilies: avoided, reason: "safe vertical default", confidence: "low", source: "vertical_default" };
}
