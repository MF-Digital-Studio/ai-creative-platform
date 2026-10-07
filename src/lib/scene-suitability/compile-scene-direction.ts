import type { ProductProfile } from "@/lib/product-understanding/product-profile";

import type { SceneSuitabilityResolution } from "./types";

const directions = {
  apparel_studio: "On-model studio scene: keep the garment silhouette, artwork, and construction readable; the model supports the product rather than the reverse.",
  apparel_street: "Street-style scene: keep the garment readable and dominant; use the location as secondary context.",
  apparel_location_editorial: "Location editorial scene: preserve a clear garment silhouette and visible product artwork; keep the setting contextual.",
  apparel_detail: "Garment detail scene: focus closely on meaningful construction, artwork, or material without losing product identity.",
  jewelry_on_body: "Close or medium-close jewelry-focused composition. A body part supports the jewelry without becoming the main subject; preserve realistic contact, scale, and visual dominance.",
  jewelry_studio: "Controlled premium jewelry studio composition with the complete product large, readable, and physically supported.",
  jewelry_macro_still_life: "Controlled premium macro jewelry still life. Preserve a clear product silhouette; shallow depth of field must not obscure identity.",
  jewelry_aesthetic_surface: "Refined jewelry surface composition with restrained tactile context; keep the jewelry large, inspectable, and dominant.",
  watch_on_wrist: "Wrist-focused premium editorial framing. Keep the watch face and case readable and dominant with realistic wrist scale and strap curvature.",
  watch_studio: "Clean premium watch product hero with readable dial, case, and strap or bracelet in controlled studio light.",
  watch_lifestyle_surface: "Premium watch lifestyle surface with contextual materials kept secondary to the readable watch hero.",
  watch_macro_detail: "Macro watch detail with a readable dial or case feature; reflections and depth of field must preserve product legibility.",
  cosmetics_studio: "Clean commercial cosmetics presentation. Keep packaging clearly visible with controlled reflections and truthful material rendering.",
  cosmetics_vanity: "Controlled vanity scene with the package large, clearly visible, and more important than surrounding beauty context.",
  cosmetics_lifestyle: "Controlled cosmetics lifestyle scene. Keep packaging visible, large, and product-led while the environment stays secondary.",
  cosmetics_aesthetic_surface: "Premium cosmetics surface still life with clear packaging silhouette and restrained supporting materials.",
  cosmetics_macro: "Close cosmetics detail composition that keeps label, package form, and material behavior readable.",
  footwear_on_foot: "On-foot footwear composition with realistic foot, ankle, flex, and ground contact; footwear remains large enough to inspect.",
  footwear_studio: "Product-focused footwear studio hero with a clear silhouette, sole definition, and controlled material detail.",
  footwear_street: "Shoe-focused low or medium street framing. Environment is contextual but secondary; keep footwear large and inspectable.",
  footwear_aesthetic_location: "Footwear-led aesthetic location scene with grounded contact and a secondary environment.",
  footwear_detail: "Close footwear detail scene that keeps construction, upper, and sole features readable.",
  bags_handheld: "Handheld bag scene with natural grip and the complete bag body, handles, closure, logo, and hardware readable.",
  bags_shoulder_carry: "Shoulder carry scene with natural contact, gravity, and a visible bag body; keep strap away from the logo.",
  bags_crossbody: "Crossbody scene with a plausible strap path and tension; avoid torso clipping and preserve source bag identity.",
  bags_under_arm: "Under-arm bag styling with the bag identity and closure remaining visible, not hidden by the body.",
  bags_tabletop: "Tabletop bag still life with credible support, supported handles, and preserved structured geometry.",
  bags_furniture: "Furniture placement with believable contact and handle support while keeping the full silhouette visible.",
  bags_luxury_still_life: "Luxury still life with a fully readable bag silhouette and distinctive source construction.",
  bags_street_editorial: "Street editorial led by the bag; keep the product large, unobstructed, and identity-accurate.",
  bags_travel_lifestyle: "Travel lifestyle setting with the bag visible and supported; the environment remains secondary.",
  bags_studio: "Product-only studio bag hero with full body, handles, closure, logo, and hardware clearly readable. Use a tabletop, pedestal, seamless backdrop, or restrained abstract set piece with controlled studio lighting. No person, model, hand, shoulder carry, worn bag, body contact, fashion portrait, walking scene, or lifestyle environment unless an explicit user instruction requires a person.",
} as const;

export function compileSceneDirection(resolution: SceneSuitabilityResolution | null, productProfile?: ProductProfile | null): string {
  void productProfile;
  return resolution ? directions[resolution.selectedSceneFamily] : "";
}
