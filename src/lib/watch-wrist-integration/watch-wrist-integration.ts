import type { ReferenceStyleBrief } from "@/lib/generation/references/reference-style-brief";
import type { SupportedVertical } from "@/lib/verticals/supported-verticals";

export type WatchWristPlacementContract = { wristPlane: string; wristAxis: string; wristSide: "left" | "right" | "unknown"; visibleWristSurface: "inner" | "outer" | "unknown"; caseOrientation: string; dialOrientation: string; dialTwelveDirection: string; crownSideConsistency: string; strapWrapDirection: string; firstLinkArticulation: string; visibleSideGeometry: string; expectedOcclusion: string; contactRegion: string; scaleTarget: string };
export type WatchWristIntegrationResolution = { active: boolean; directReference: boolean; wristGeometryAvailable: boolean; placementContract: WatchWristPlacementContract | null; sourceIdentityPreserved: boolean };

const productOnlyTerms = /\b(?:product[ -]?only|tabletop|pedestal|still[ -]?life|packshot|catalog(?:ue)?|flat[ -]?lay)\b/i;
const wristTerms = /\b(?:wrist|on[ -]?wrist|wear(?:ing|n)?|worn|arm)\b/i;
const leftWristTerms = /\b(?:left[ -]?wrist|left arm|sol bilek|sol kol)\b/i;
const rightWristTerms = /\b(?:right[ -]?wrist|right arm|sağ bilek|sag bilek|sağ kol|sag kol)\b/i;
const innerWristTerms = /\b(?:inner[ -]?wrist|palm[ -]?up|volar|inside of (?:the )?wrist|iç bilek|ic bilek|avuç içi|avuc ici)\b/i;
const outerWristTerms = /\b(?:outer[ -]?wrist|back of (?:the )?hand|dorsal|top of (?:the )?wrist|dış bilek|dis bilek|el üstü|el ustu)\b/i;

function resolveWristSide(text: string): "left" | "right" | "unknown" {
  if (leftWristTerms.test(text)) return "left";
  if (rightWristTerms.test(text)) return "right";
  return "unknown";
}

function resolveVisibleWristSurface(text: string): "inner" | "outer" | "unknown" {
  if (innerWristTerms.test(text)) return "inner";
  if (outerWristTerms.test(text)) return "outer";
  return "unknown";
}

export function resolveWatchWristIntegration(input: { vertical: SupportedVertical | null; expectsHuman: boolean; isProductOnly: boolean; onWristStrategy?: boolean; interactionMode?: string | null; creativeDirection?: string | null; directReference?: boolean; referenceStyle?: ReferenceStyleBrief | null }): WatchWristIntegrationResolution {
  const referenceText = input.referenceStyle ? [input.referenceStyle.poseLanguage, input.referenceStyle.shotProfile?.interaction, input.referenceStyle.shotProfile?.humanPose, input.referenceStyle.shotProfile?.handDirection].filter(Boolean).join(" ") : "";
  const orientationText = `${input.creativeDirection ?? ""} ${referenceText}`;
  const wornIntent = input.interactionMode?.toLowerCase() === "wrist" || wristTerms.test(`${input.creativeDirection ?? ""} ${referenceText}`);
  const active = input.vertical === "watches" && input.expectsHuman && !input.isProductOnly && !productOnlyTerms.test(input.creativeDirection ?? "") && (wornIntent || input.onWristStrategy === true || (input.directReference === true && wristTerms.test(referenceText)));
  const wristGeometryAvailable = Boolean(input.referenceStyle && wristTerms.test(referenceText));
  const wristSide = resolveWristSide(orientationText);
  const visibleWristSurface = resolveVisibleWristSurface(orientationText);
  return { active, directReference: active && input.directReference === true, wristGeometryAvailable, placementContract: active ? { wristPlane: wristGeometryAvailable ? "reference wrist plane and arm angle" : "visible wrist plane inferred from the human pose", wristAxis: wristGeometryAvailable ? "reference wrist longitudinal axis" : "visible wrist longitudinal axis", wristSide, visibleWristSurface, caseOrientation: "case rotated and foreshortened to the wrist plane and camera; never mirror the watch", dialOrientation: "dial rotation follows the resolved wrist side, visible wrist surface, forearm axis, and camera; never use image-top as the upright direction", dialTwelveDirection: "the 12 marker points toward the forearm/elbow and the 6 marker toward the hand in wrist-local coordinates; inner versus outer wrist changes the visible face angle but never mirrors or reverses the dial", crownSideConsistency: "preserve the source crown or pusher side relative to the dial; rotate the complete case with the wrist and never mirror, move, swap, or relocate the crown side", strapWrapDirection: "strap or bracelet follows the wrist circumference and disappears at the far-side occlusion", firstLinkArticulation: "the first bracelet links articulate continuously from each lug and begin their wrist-following curve immediately, without a straight floating gap or a fused hinge", visibleSideGeometry: "case thickness, bezel depth, sidewalls, lugs, crown or pushers visible where camera angle permits", expectedOcclusion: "far strap/bracelet segments are naturally hidden by the wrist", contactRegion: "case back and adjacent strap or first links seat against skin with subtle pressure, local contact shadow, and no visible gap", scaleTarget: "anatomically plausible watch-to-wrist width and thickness" } : null, sourceIdentityPreserved: input.vertical === "watches" };
}

export function compileWatchWristIntegrationPrompt(resolution: WatchWristIntegrationResolution): string {
  if (!resolution.active || !resolution.placementContract) return "";
  return ["WATCH WRIST INTEGRATION V2 — The source watch controls product identity only: case design, dial, bezel, crown/pushers, strap/bracelet, materials, and proportions. Its flat catalog orientation is not placement authority.", resolution.directReference ? "DIRECT REFERENCE AUTHORITY: preserve the reference wrist pose, arm angle, camera angle, body placement, and framing. Replace any reference watch with the source watch; rebuild the source watch in correct 3D perspective for that wrist." : "Resolve placement from the visible human wrist and camera; do not require user instructions.", "The watch must be physically worn on the wrist, not overlaid as a flat product image. Resolve case and dial rotation from the real wrist pose and camera, never from the source product image. In a raised-arm or side-on wrist view, the dial must turn with the wrist rather than face the camera head-on; when that rotation requires it, the 12 marker must visibly shift toward the left or upper-left instead of staying at the image top. Align and foreshorten the case naturally according to the wrist angle. Show believable case thickness, bezel depth, sidewall geometry, lugs, crown/pushers, and strap attachment. The strap or bracelet must curve around the wrist and disappear naturally around the far side where occluded. The case back and strap must seat against skin with realistic compression, local contact shadow, and subtle seating. Do not preserve a front-facing catalog orientation when that orientation conflicts with the wrist perspective. Do not render the watch as floating, pasted-on, sticker-like, or planar.", `Placement contract: ${JSON.stringify(resolution.placementContract)}.`].join("\n");
}
