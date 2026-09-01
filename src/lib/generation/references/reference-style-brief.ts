export const REFERENCE_ANALYSIS_VERSION = 1;

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
    isNonEmptyString(brief.realismCharacter),
  );
}

export function renderReferenceStyleBrief(brief: ReferenceStyleBrief): string {
  return [
    "Reference visual direction (style only; create an original image and never copy reference products, identities, logos, text, artwork, or an exact composition):",
    `Visual intent: ${brief.visualIntent}`,
    `Composition: ${brief.composition.framing}; ${brief.composition.cameraAngle}; ${brief.composition.cameraDistance}; ${brief.composition.subjectPlacement}.`,
    `Lighting: ${brief.lighting.character}; ${brief.lighting.direction}; ${brief.lighting.flashBehavior ?? "no specific flash behavior"}; ${brief.lighting.ambientExposure}; ${brief.lighting.contrast}.`,
    `Environment: ${brief.environment.setting}; ${brief.environment.architecturalCharacter ?? "no specific architectural character"}; ${brief.environment.surfaceCharacter ?? "no specific surface character"}.`,
    `Color: ${brief.color.palette}; ${brief.color.grading}; ${brief.color.saturation}.`,
    `Texture: ${brief.texture.grain}; ${brief.texture.sharpness}; ${brief.texture.retouching}.`,
    `Depth of field: ${brief.depthOfField}.`,
    brief.poseLanguage ? `Pose language: ${brief.poseLanguage}.` : "",
    `Realism character: ${brief.realismCharacter}.`,
  ].filter(Boolean).join("\n");
}
