import { isProductProfile } from "@/lib/product-understanding/product-profile";
import type { ProductProfile } from "@/lib/product-understanding/types";

const openToeTerms = /\b(open[\s-]?toe(?:d)?|peep[\s-]?toe|sandal|strappy(?:\s+(?:heel|shoe))?|toe[\s-]?post|flip[\s-]?flop|slides?)\b/i;
const visibleToeTerms = /\b(visible|exposed|show(?:ing)?|bare)\s+(?:foot|feet|toe|toes)\b|\btoes?\s+(?:visible|exposed|showing)\b/i;
const highHeelTerms = /\b(high[\s-]?heel|stiletto|heeled\s+sandal)\b/i;
const closedToeTerms = /\b(closed[\s-]?toe|covered[\s-]?toe|sneaker|boot|loafer|oxford|derby)\b/i;

export type FootwearAnatomyPolicy = {
  applies: boolean;
  openToe: boolean;
  reason: "open_toe_product" | "high_heel_with_visible_toes" | "closed_toe_or_not_footwear";
};

export function resolveFootwearAnatomyPolicy(input: {
  vertical: string | null;
  productProfile?: ProductProfile | null;
  creativeDirection?: string | null;
}): FootwearAnatomyPolicy {
  if (input.vertical !== "footwear") return { applies: false, openToe: false, reason: "closed_toe_or_not_footwear" };

  const profile = isProductProfile(input.productProfile) && input.productProfile.vertical === "footwear"
    ? input.productProfile
    : null;
  const details = profile?.verticalAttributes.vertical === "footwear" ? profile.verticalAttributes.details : null;
  const productText = [profile?.subcategory, details?.shoeType, details?.silhouette, details?.heel, ...(details?.panelStructure ?? [])].filter(Boolean).join(" ");
  const direction = input.creativeDirection ?? "";
  const combined = `${productText} ${direction}`;
  const explicitlyClosed = closedToeTerms.test(productText) && !openToeTerms.test(productText);
  if (explicitlyClosed) return { applies: false, openToe: false, reason: "closed_toe_or_not_footwear" };
  if (openToeTerms.test(combined)) return { applies: true, openToe: true, reason: "open_toe_product" };
  if (highHeelTerms.test(combined) && visibleToeTerms.test(direction)) return { applies: true, openToe: true, reason: "high_heel_with_visible_toes" };
  return { applies: false, openToe: false, reason: "closed_toe_or_not_footwear" };
}

export const footwearAnatomyPrompt = [
  "OPEN-TOE FOOT ANATOMY — HARD REQUIREMENT: Any visible human foot must be anatomically correct, and each visible foot must have exactly five toes.",
  "Do not omit, merge, duplicate, crop, or deform any visible toe. Preserve realistic foot proportions and natural toe spacing.",
  "Align every toe naturally with the shoe straps, sole, footbed, and foot pose; the foot must fit the sandal without intersections, floating straps, or implausible pressure.",
].join("\n");
