export const REFERENCE_ANALYSIS_VERSION = 1;

import type { ReferenceShotProfile } from "./reference-shot-profile";
import { isReferenceShotProfile } from "./reference-shot-profile";

export type ReferenceStyleBrief = {
  visualIntent: string;
  composition: {
    framing: string;
    cameraAngle: string;
    cameraDistance: string;
    subjectPlacement: string;
  };
  lighting: {
    character: string;
    direction: string;
    flashBehavior: string | null;
    ambientExposure: string;
    contrast: string;
  };
  environment: {
    setting: string;
    architecturalCharacter: string | null;
    surfaceCharacter: string | null;
  };
  color: {
    palette: string;
    grading: string;
    saturation: string;
  };
  texture: {
    grain: string;
    sharpness: string;
    retouching: string;
  };
  depthOfField: string;
  poseLanguage: string | null;
  realismCharacter: string;
  /** V2 structured shot semantics; legacy briefs may omit this and are safely derived. */
  shotProfile?: ReferenceShotProfile;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isNonEmptyString(value);
}

export function isReferenceStyleBrief(value: unknown): value is ReferenceStyleBrief {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const brief = value as Record<string, unknown>;
  const composition = brief.composition as Record<string, unknown> | undefined;
  const lighting = brief.lighting as Record<string, unknown> | undefined;
  const environment = brief.environment as Record<string, unknown> | undefined;
  const color = brief.color as Record<string, unknown> | undefined;
  const texture = brief.texture as Record<string, unknown> | undefined;
  const shotProfile = brief.shotProfile;

  return Boolean(
    isNonEmptyString(brief.visualIntent) &&
    composition && ["framing", "cameraAngle", "cameraDistance", "subjectPlacement"].every(
      (key) => isNonEmptyString(composition[key]),
    ) &&
    lighting && ["character", "direction", "ambientExposure", "contrast"].every(
      (key) => isNonEmptyString(lighting[key]),
    ) && isNullableString(lighting.flashBehavior) &&
    environment && isNonEmptyString(environment.setting) &&
    isNullableString(environment.architecturalCharacter) &&
    isNullableString(environment.surfaceCharacter) &&
    color && ["palette", "grading", "saturation"].every((key) => isNonEmptyString(color[key])) &&
    texture && ["grain", "sharpness", "retouching"].every((key) => isNonEmptyString(texture[key])) &&
    isNonEmptyString(brief.depthOfField) &&
    isNullableString(brief.poseLanguage) &&
    isNonEmptyString(brief.realismCharacter) &&
    (shotProfile === undefined || isReferenceShotProfile(shotProfile)),
  );
}

export function renderReferenceStyleBrief(brief: ReferenceStyleBrief): string {
  return [
    "REFERENCE PRIORITY V1 — Reference 1 is the primary authority for scene, composition, pose, framing, camera, crop intent, and subject placement. Match its structure as closely as practical while creating an original image; pixel-perfect copying is not required.",
    "References 2 and 3 are supporting references for lighting, mood, color, styling, atmosphere, environmental details, and editorial texture only. They must not replace or substantially alter Reference 1's composition, pose, camera, framing, or scene layout.",
    "The uploaded source product is the highest authority for product identity. Replace any reference product with it and preserve its geometry, logo, artwork, color, materials, stones, dial, packaging, panels, and silhouette.",
    `Visual intent: ${brief.visualIntent}`,
    `Primary reference composition: ${brief.composition.framing}; ${brief.composition.cameraAngle}; ${brief.composition.cameraDistance}; ${brief.composition.subjectPlacement}.`,
    `Lighting: ${brief.lighting.character}; ${brief.lighting.direction}; ${brief.lighting.flashBehavior ?? "no specific flash behavior"}; ${brief.lighting.ambientExposure}; ${brief.lighting.contrast}.`,
    `Environment: ${brief.environment.setting}; ${brief.environment.architecturalCharacter ?? "no specific architectural character"}; ${brief.environment.surfaceCharacter ?? "no specific surface character"}.`,
    `Color: ${brief.color.palette}; ${brief.color.grading}; ${brief.color.saturation}.`,
    `Texture: ${brief.texture.grain}; ${brief.texture.sharpness}; ${brief.texture.retouching}.`,
    `Depth of field: ${brief.depthOfField}.`,
    brief.poseLanguage ? `Primary reference pose language: ${brief.poseLanguage}.` : "",
    `Realism character: ${brief.realismCharacter}.`,
  ].filter(Boolean).join("\n");
}
