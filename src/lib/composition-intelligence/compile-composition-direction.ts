import type { CompositionProfile } from "./types";

export function compileCompositionDirection(profile: CompositionProfile | null): string {
  if (!profile) return "";
  return [
    `Use ${profile.framing.replace("_", " ")} framing at ${profile.cameraDistance} camera distance with a ${profile.subjectScale.replace("_", " ")} product scale.`,
    `Keep the product ${profile.productDominance} in the composition from a ${profile.preferredAngle.replace("_", " ")} angle.`,
    `Use ${profile.depthOfField.replaceAll("_", " ")} depth of field.`,
    `Composition guards: ${profile.negativeCompositionRules.join(" ")}`,
  ].join(" ");
}
