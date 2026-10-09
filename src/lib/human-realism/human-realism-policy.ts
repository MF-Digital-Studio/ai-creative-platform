import type { HumanFocusArea, HumanRealismContext, HumanRealismPolicy } from "./types";

export function resolveHumanRealismPolicy(context: HumanRealismContext): HumanRealismPolicy {
  const onBody = ["fashion_on_model", "jewelry_on_model", "watch_on_wrist", "footwear_on_model", "bags_on_model"].includes(context.strategy);
  if (!onBody && !context.visibleHuman) return { applied: false, focusAreas: [] };
  const areas = new Set<HumanFocusArea>(["skin", "body", "contact"]);
  if (context.strategy === "jewelry_on_model" || context.strategy === "watch_on_wrist" || context.strategy === "bags_on_model" || context.handsVisible) {
    areas.add("hands"); areas.add("nails");
  }
  if (context.strategy === "footwear_on_model" || context.feetVisible) areas.add("feet");
  if (context.strategy === "fashion_on_model" || context.faceVisible || context.vertical === "cosmetics") {
    areas.add("face"); areas.add("hair");
  }
  if (context.strategy === "footwear_on_model" || context.strategy === "bags_on_model") areas.delete("face");
  return { applied: true, focusAreas: [...areas] };
}
