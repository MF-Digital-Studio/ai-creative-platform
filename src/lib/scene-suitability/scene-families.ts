import type { SupportedVertical } from "@/lib/verticals/supported-verticals";

import type { SceneFamily } from "./types";

export const sceneFamiliesByVertical: Record<SupportedVertical, readonly SceneFamily[]> = {
  apparel: ["apparel_studio", "apparel_street", "apparel_location_editorial", "apparel_detail"],
  jewelry: ["jewelry_on_body", "jewelry_studio", "jewelry_macro_still_life", "jewelry_aesthetic_surface"],
  watches: ["watch_studio", "watch_on_wrist", "watch_lifestyle_surface", "watch_macro_detail"],
  cosmetics: ["cosmetics_studio", "cosmetics_vanity", "cosmetics_lifestyle", "cosmetics_aesthetic_surface", "cosmetics_macro"],
  footwear: ["footwear_studio", "footwear_on_foot", "footwear_street", "footwear_aesthetic_location", "footwear_detail"],
};

export function sceneFamilyVertical(family: SceneFamily): SupportedVertical {
  if (family.startsWith("apparel_")) return "apparel";
  if (family.startsWith("jewelry_")) return "jewelry";
  if (family.startsWith("watch_")) return "watches";
  if (family.startsWith("cosmetics_")) return "cosmetics";
  return "footwear";
}
