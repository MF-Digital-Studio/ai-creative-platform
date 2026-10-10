import type { CompositionProfile } from "./types";

export function compileCompositionDirection(profile: CompositionProfile | null): string {
  if (!profile) return "";
  return [
    `Use ${profile.framing.replace("_", " ")} framing at ${profile.cameraDistance} camera distance with a ${profile.subjectScale.replace("_", " ")} product scale.`,
    `Keep the product ${profile.productDominance} in the composition from a ${profile.preferredAngle.replace("_", " ")} angle.`,
    `Use ${profile.depthOfField.replaceAll("_", " ")} depth of field.`,
    profile.subjectPlacement ? `Place the subject ${profile.subjectPlacement.replaceAll("_", " ")}.` : "",
    profile.productOrientation ? `Keep product orientation ${profile.productOrientation.replaceAll("_", " ")}.` : "",
    profile.physicalSupport ? `Physical support must be ${profile.physicalSupport.replaceAll("_", " ")}.` : "",
    profile.productCount ? `Product count semantics: ${profile.productCount.replaceAll("_", " ")}.` : "",
    profile.targetDetail ? `Make ${profile.targetDetail.replaceAll("_", " ")} visually dominant.` : "",
    `Composition guards: ${profile.negativeCompositionRules.join(" ")}`,
  ].filter(Boolean).join(" ");
}
