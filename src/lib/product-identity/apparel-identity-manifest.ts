import { isProductProfile } from "@/lib/product-understanding/product-profile";
import type { ProductRegion } from "@/lib/product-understanding/vertical-attributes";

export type NormalizedArtworkRegion = { x: number; y: number; width: number; height: number; confidence: "profile_estimate" | "source_localization" };
export type ApparelIdentityManifest = {
  garmentType: string;
  silhouette: string;
  sleeveLength: string | null;
  collarOrNeckline: string | null;
  fitCategory: string | null;
  dominantGarmentColor: string | null;
  artworkPresent: boolean | null;
  artworkSide: "front" | "back" | "unknown";
  artworkBoundingRegion: NormalizedArtworkRegion | null;
  artworkScaleRelativeToGarment: string | null;
  artworkPlacement: string[];
  artworkCategory: "graphic" | "text" | "mixed" | "unknown";
  visibleTextRegions: string[];
  majorArtworkShapes: string[];
  artworkIsMainIdentityAnchor: boolean;
};

/** Converts the existing apparel analysis into a compact identity lock. Location text yields an estimate, not pixel detection. */
export function resolveApparelArtworkRegion(input: {
  profile?: unknown;
  artworkRegion?: NormalizedArtworkRegion | null;
}): ApparelIdentityManifest | null {
  if (!isProductProfile(input.profile) || input.profile.vertical !== "apparel") return null;
  if (input.profile.verticalAttributes.vertical !== "apparel") return null;
  const details = input.profile.verticalAttributes.details;
  const regions = details.artworkOrLogoLocations;
  const locationText = regions.map(({ location, description }) => `${location} ${description}`).join(" ");
  const side = details.identitySides.length === 1 ? details.identitySides[0] : /back/i.test(locationText) ? "back" : /front|chest/i.test(locationText) ? "front" : "unknown";
  const position = /upper|chest|collar|shoulder/i.test(locationText) ? { x: 0.25, y: 0.2, width: 0.5, height: 0.3 }
    : /lower|hem/i.test(locationText) ? { x: 0.25, y: 0.65, width: 0.5, height: 0.25 }
      : /center|centre|middle/i.test(locationText) ? { x: 0.25, y: 0.35, width: 0.5, height: 0.3 } : null;
  const hasText = /text|letter|word|typography|logo|print/i.test(locationText);
  const hasGraphic = /graphic|illustration|artwork|image|print/i.test(locationText);
  return {
    garmentType: details.garmentType,
    silhouette: details.constructionDetails.join(", ") || input.profile.productShape,
    sleeveLength: details.constructionDetails.find((item) => /sleeve/i.test(item)) ?? null,
    collarOrNeckline: details.hoodOrCollar,
    fitCategory: details.constructionDetails.find((item) => /fit|oversized|slim|relaxed/i.test(item)) ?? null,
    dominantGarmentColor: details.primaryColor ?? input.profile.dominantColors[0] ?? null,
    artworkPresent: regions.length > 0 || input.profile.visibleBranding.hasArtwork === true || input.profile.visibleBranding.hasLogo === true
      ? true
      : input.profile.visibleBranding.hasArtwork === false && input.profile.visibleBranding.hasLogo === false ? false : null,
    artworkSide: side,
    artworkBoundingRegion: input.artworkRegion ?? (position ? { ...position, confidence: "profile_estimate" } : null),
    artworkScaleRelativeToGarment: /large|oversized|full/i.test(locationText) ? "large" : regions.length ? "preserve source relative scale" : null,
    artworkPlacement: regions.map(({ location, description }) => `${location}: ${description}`),
    artworkCategory: hasText && hasGraphic ? "mixed" : hasText ? "text" : hasGraphic ? "graphic" : regions.length ? "unknown" : "unknown",
    visibleTextRegions: regions.filter(({ description }) => /text|letter|word|typography|logo/i.test(description)).map((region) => `${region.location}: ${region.description}`),
    majorArtworkShapes: regions.filter(({ description }) => /graphic|illustration|shape|artwork/i.test(description)).map(({ description }) => description),
    artworkIsMainIdentityAnchor: regions.some(({ description, location }) => /large|main|primary|back print/i.test(`${description} ${location}`)),
  };
}

export function apparelArtworkProfileRegions(manifest: ApparelIdentityManifest): ProductRegion[] {
  return manifest.artworkPlacement.map((item) => ({ location: item.split(":", 1)[0] ?? item, description: item.split(":").slice(1).join(":").trim() }));
}

export function compileApparelArtworkLock(manifest: ApparelIdentityManifest): string {
  return [
    "SOURCE APPAREL IDENTITY — EXACT PRODUCT AUTHORITY.",
    `Preserve the exact ${manifest.garmentType} identity, silhouette, construction, and garment color.`,
    manifest.artworkPresent ? ["SOURCE ARTWORK IDENTITY — EXACT DESIGN AUTHORITY. The separate artwork identity source, when supplied, contains the exact graphic printed on the source garment. Preserve its exact visual identity; do not reinterpret, redraw, simplify, restyle, replace, or invent typography. Do not substitute a similar design.", "Preserve major shapes, text layout, graphic composition, color relationships, illustration structure, and relative element placement. Typography and visible text are identity-critical: no different, reordered, missing, invented, or approximated lettering. Do not reinterpret the print.", `ARTWORK PLACEMENT LOCK — preserve the same placement class and proportions relative to collar, side edges, lower hem, and garment torso. Keep width and height relative to the garment consistent. Artwork location: ${manifest.artworkPlacement.join("; ") || "match source pixels"}.`, `Preserve the exact artwork composition, ${manifest.artworkSide} placement, artwork size relative to the garment, orientation, visible text, and major graphic silhouettes.`].join(" ") : "Preserve the exact garment identity and do not invent artwork.",
    "Allow artwork deformation only from fabric folds, perspective, body curvature, and natural drape.",
    "Hierarchy: source garment identity; source artwork identity; artwork placement; natural garment deformation; scene/reference; user creative direction; decorative style. References may influence pose, environment, camera, lighting, and composition only, never print design, typography, print color, print placement, or garment identity.",
    "Allow only natural changes from folds, drape, body curvature, perspective, and lighting.",
  ].join("\n");
}

export function buildApparelFidelityBenchmarkPrompts(): Array<{ key: string; prompt: string }> {
  return [
    { key: "clean_studio_on_model", prompt: "Show the exact uploaded apparel on a neutral adult model against a clean studio background. Keep source artwork, text, placement, scale, color, silhouette, and construction exact." },
    { key: "ghost_mannequin_or_flat_lay", prompt: "Present the exact uploaded apparel as a clean ghost-mannequin or laid-flat studio product image. Preserve every visible source graphic, text region, placement, scale, color, and construction detail." },
    { key: "neutral_lifestyle_pose", prompt: "Show the exact uploaded apparel in a simple neutral lifestyle pose with minimal styling. Preserve the source artwork, text, placement, scale, color, silhouette, and construction." },
  ];
}

export async function runSourceProductFidelityBenchmark<T>(generate: (input: {
  key: string;
  prompt: string;
  referenceImages: readonly [];
}) => Promise<T>): Promise<Array<{ key: string; result: T }>> {
  const cases = buildApparelFidelityBenchmarkPrompts();
  const results = await Promise.all(cases.map(async ({ key, prompt }) => ({
    key,
    result: await generate({ key, prompt, referenceImages: [] }),
  })));
  return results;
}
