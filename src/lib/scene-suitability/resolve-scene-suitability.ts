import { isProductProfile } from "@/lib/product-understanding/product-profile";
import type { ProductProfile } from "@/lib/product-understanding/product-profile";
import type { SupportedVertical } from "@/lib/verticals/supported-verticals";

import { sceneFamiliesByVertical } from "./scene-families";
import type { ResolveSceneSuitabilityInput, SceneFamily, SceneSuitabilityResolution } from "./types";

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
  "apparel-street-style": "apparel_street", "apparel-scenic-editorial": "apparel_location_editorial", "apparel-studio-style": "apparel_studio",
  "jewelry-on-body": "jewelry_on_body", "jewelry-studio": "jewelry_studio", "jewelry-scenic": "jewelry_aesthetic_surface",
  "watch-on-wrist": "watch_on_wrist", "watch-bright-studio": "watch_studio", "watch-scenic-environment": "watch_lifestyle_surface",
  "footwear-hero-focus": "footwear_detail", "footwear-studio": "footwear_studio", "footwear-street-lifestyle": "footwear_street",
  "cosmetics-studio": "cosmetics_studio", "cosmetics-aesthetic-setting": "cosmetics_vanity", "cosmetics-lifestyle-landscape": "cosmetics_lifestyle",
  "bags-street-editorial": "bags_street_editorial", "bags-minimal-studio": "bags_studio", "bags-crossbody-lifestyle": "bags_crossbody",
};

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

export function resolveSceneSuitability(input: ResolveSceneSuitabilityInput): SceneSuitabilityResolution | null {
  const vertical = verticalFrom(input);
  if (!vertical) return null;
  const profile = isProductProfile(input.productProfile) ? input.productProfile : null;
  const suitable = profile ? profilePriority(profile) : sceneFamiliesByVertical[vertical];
  const avoided = Object.values(sceneFamiliesByVertical).flat().filter((family) => !suitable.includes(family));
  const preset = input.preset ? presetFamilies[input.preset.id] : null;
  if (input.presetAuthority === "strong" && preset && suitable.includes(preset) && !(vertical === "bags" && (intentsFrom(input.userPrompt).has("crossbody") || intentsFrom(input.userPrompt).has("shoulder") || intentsFrom(input.userPrompt).has("hand")))) return { selectedSceneFamily: preset, suitableSceneFamilies: suitable, avoidedSceneFamilies: avoided, reason: "selected preset family is authoritative for preset-only generation", confidence: "high", source: "trusted_preset" };
  const intent = intentFamily(vertical, intentsFrom(input.userPrompt), profile);
  if (intent) return { selectedSceneFamily: intent, suitableSceneFamilies: suitable, avoidedSceneFamilies: avoided, reason: "compatible explicit user scene intent", confidence: "high", source: "explicit_user_intent" };
  if (preset && suitable.includes(preset)) return { selectedSceneFamily: preset, suitableSceneFamilies: suitable, avoidedSceneFamilies: avoided, reason: "trusted preset scene intent", confidence: "high", source: "trusted_preset" };
  if (profile) return { selectedSceneFamily: suitable[0], suitableSceneFamilies: suitable, avoidedSceneFamilies: avoided, reason: "ProductProfile physical interaction and subcategory evidence", confidence: "high", source: "product_profile" };
  const strategy = strategyFamily(vertical, input.strategy);
  if (strategy) return { selectedSceneFamily: strategy, suitableSceneFamilies: suitable, avoidedSceneFamilies: avoided, reason: "resolved generation strategy", confidence: "medium", source: "strategy_default" };
  return { selectedSceneFamily: suitable[0], suitableSceneFamilies: suitable, avoidedSceneFamilies: avoided, reason: "safe vertical default", confidence: "low", source: "vertical_default" };
}
