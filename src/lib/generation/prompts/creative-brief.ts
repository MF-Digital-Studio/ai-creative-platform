import type { PhotographyCapture } from "./fashion-capture-profiles";

export const creativeBriefFields = [
  "subject",
  "pose",
  "environment",
  "composition",
  "camera",
  "lighting",
  "mood",
  "realism",
  "productTreatment",
  "negativeConstraints",
] as const;

export type CreativeBrief = {
  [Field in (typeof creativeBriefFields)[number]]: string;
} & {
  capture: PhotographyCapture | null;
};

export function isCreativeBrief(value: unknown): value is CreativeBrief {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (!creativeBriefFields.every(
    (field) => typeof candidate[field] === "string" && candidate[field].trim().length > 0,
  )) {
    return false;
  }

  if (candidate.capture === null) return true;
  if (!candidate.capture || typeof candidate.capture !== "object" || Array.isArray(candidate.capture)) {
    return false;
  }

  const capture = candidate.capture as Record<string, unknown>;
  return [
    "profile", "captureStyle", "focalLength", "cameraDistance", "lightingCharacter",
    "flashBehavior", "ambientExposure", "depthOfField", "imageTexture", "grain",
    "dynamicRange", "skinTreatment", "retouchingLevel", "realismConstraints",
  ].every((field) => typeof capture[field] === "string" && capture[field].trim().length > 0);
}

const creativeBriefLabels: Record<(typeof creativeBriefFields)[number], string> = {
  subject: "Subject",
  pose: "Pose and action",
  environment: "Environment",
  composition: "Composition",
  camera: "Camera",
  lighting: "Lighting",
  mood: "Mood",
  realism: "Realism",
  productTreatment: "Product treatment",
  negativeConstraints: "Negative constraints",
};

export function renderCreativeBrief(brief: CreativeBrief): string {
  const base = [
    "Professional creative direction:",
    ...creativeBriefFields.map((field) => `${creativeBriefLabels[field]}: ${brief[field].trim()}`),
  ];

  if (!brief.capture) return base.join("\n");

  return [
    ...base,
    `Capture profile: ${brief.capture.profile}`,
    `Capture style: ${brief.capture.captureStyle}`,
    `Focal length and framing: ${brief.capture.focalLength}`,
    `Camera distance: ${brief.capture.cameraDistance}`,
    `Lighting character: ${brief.capture.lightingCharacter}`,
    `Flash behavior: ${brief.capture.flashBehavior}`,
    `Ambient exposure: ${brief.capture.ambientExposure}`,
    `Depth of field: ${brief.capture.depthOfField}`,
    `Image texture: ${brief.capture.imageTexture}`,
    `Grain: ${brief.capture.grain}`,
    `Dynamic range: ${brief.capture.dynamicRange}`,
    `Skin treatment: ${brief.capture.skinTreatment}`,
    `Retouching level: ${brief.capture.retouchingLevel}`,
    `Realism constraints: ${brief.capture.realismConstraints}`,
  ].join("\n");
}
