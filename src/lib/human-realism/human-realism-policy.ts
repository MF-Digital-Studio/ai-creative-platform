import type { HumanFocusArea, HumanRealismContext, HumanRealismPolicy } from "./types";

export function resolveHumanRealismPolicy(context: HumanRealismContext): HumanRealismPolicy {
  const productOnlyModes = new Set(["ghost_mannequin", "floating", "flat_lay", "hanger", "product_hero", "pedestal", "still_life"]);
  const normalizedMode = context.presentationMode?.trim().toLowerCase().replace(/[\s-]+/g, "_") ?? null;
  const explicitlyProductOnly = context.presetHumanPresence === "none" || Boolean(normalizedMode && productOnlyModes.has(normalizedMode));
  const onBody = ["fashion_on_model", "jewelry_on_model", "watch_on_wrist", "footwear_on_model", "bags_on_model"].includes(context.strategy);
  const interactionImpliesHuman = ["held", "worn", "near_face", "walking", "shoulder_carry", "crossbody", "neck", "wrist", "hand"].includes(context.interactionMode?.toLowerCase() ?? "");
  const expected = !explicitlyProductOnly && (context.expectsHuman ?? (onBody || context.visibleHuman === true || context.referenceHumanPresent === true || context.presetHumanPresence === "partial" || context.presetHumanPresence === "full" || interactionImpliesHuman));
  if (!expected) return { version: "human-realism-v2", expected: false, applied: false, focusAreas: [] };
  const areas = new Set<HumanFocusArea>(["skin", "body", "contact"]);
  if (context.strategy === "jewelry_on_model" || context.strategy === "watch_on_wrist" || context.strategy === "bags_on_model" || context.handsVisible) {
    areas.add("hands"); areas.add("nails");
  }
  if (context.strategy === "footwear_on_model" || context.feetVisible) areas.add("feet");
  if ((context.vertical === "apparel" && expected) || context.strategy === "fashion_on_model" || context.faceVisible || context.vertical === "cosmetics") {
    areas.add("face"); areas.add("hair");
  }
  if (context.strategy === "footwear_on_model" || context.strategy === "bags_on_model") areas.delete("face");
  return { version: "human-realism-v2", expected: true, applied: true, focusAreas: [...areas] };
}
