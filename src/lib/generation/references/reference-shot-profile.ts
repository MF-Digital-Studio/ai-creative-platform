import type { ReferenceStyleBrief } from "./reference-style-brief";

export const REFERENCE_MATCH_VERSION = "reference-match-v2" as const;

export type ReferenceMode = "inspired" | "match";
export type ReferenceFraming = "macro" | "close_up" | "medium_close" | "medium" | "full_product" | "environmental";
export type ReferenceCameraAngle = "top_down" | "eye_level" | "low_angle" | "three_quarter" | "product_level" | "unknown";
export type ReferenceCameraDistance = "macro" | "close" | "medium" | "wide" | "unknown";
export type ReferenceSubjectPlacement = "centered" | "rule_of_thirds_left" | "rule_of_thirds_right" | "upper_center" | "lower_center" | "asymmetric_negative_space" | "unknown";
export type ReferenceInteraction = "none" | "held" | "worn" | "near_face" | "on_pedestal" | "stacked" | "unknown";
export type ReferenceHandDirection = "top" | "left" | "right" | "bottom" | "none" | "unknown";
export type ReferenceLighting = "soft_diffused" | "hard_directional" | "backlit" | "rim_light" | "side_light" | "high_key" | "low_key" | "warm" | "cool" | "glossy_commercial" | "editorial_natural" | "unknown";
export type ReferenceBackground = "seamless_studio" | "solid_color" | "gradient_backdrop" | "cafe_counter" | "vanity" | "street" | "reflective_surface" | "pedestal" | "stone_surface" | "fabric" | "architectural" | "unknown";

export type ReferenceShotProfile = {
  framing: ReferenceFraming | null;
  cameraAngle: ReferenceCameraAngle | null;
  cameraDistance: ReferenceCameraDistance | null;
  subjectPlacement: ReferenceSubjectPlacement | null;
  productScale: "extreme_close" | "large" | "medium" | "contextual" | null;
  interaction: ReferenceInteraction | null;
  humanPose: string | null;
  handDirection: ReferenceHandDirection | null;
  lighting: ReferenceLighting | null;
  background: ReferenceBackground | null;
  environment: string | null;
  surfaces: string | null;
  props: string | null;
  depthOfField: "shallow" | "moderate" | "deep" | null;
  negativeSpace: "none" | "left" | "right" | "top" | "bottom" | "asymmetric" | null;
  realism: "photographic" | "editorial" | "commercial" | "natural" | null;
  compositionNotes: string | null;
  nonTransferableIdentityFeatures: string[];
};

const identityWarnings = [
  "reference product logo and brand name",
  "exact label text and campaign text",
  "reference product color when it conflicts with the uploaded product",
  "reference product geometry and packaging identity",
  "stone layout, watch dial identity, shoe panel identity, and garment artwork",
];

export function isReferenceShotProfile(value: unknown): value is ReferenceShotProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const profile = value as Record<string, unknown>;
  return Array.isArray(profile.nonTransferableIdentityFeatures)
    && profile.nonTransferableIdentityFeatures.every((item) => typeof item === "string")
    && ["framing", "cameraAngle", "cameraDistance", "subjectPlacement", "productScale", "interaction", "humanPose", "handDirection", "lighting", "background", "environment", "surfaces", "props", "depthOfField", "negativeSpace", "realism", "compositionNotes"]
      .every((key) => key in profile && (profile[key] === null || typeof profile[key] === "string"));
}

export function deriveReferenceShotProfile(brief: ReferenceStyleBrief): ReferenceShotProfile {
  const framing = /macro/i.test(brief.composition.framing) ? "macro" : /close/i.test(brief.composition.framing) ? "close_up" : "medium";
  const cameraAngle = /top|overhead/i.test(brief.composition.cameraAngle) ? "top_down" : /low/i.test(brief.composition.cameraAngle) ? "low_angle" : /three/i.test(brief.composition.cameraAngle) ? "three_quarter" : /eye/i.test(brief.composition.cameraAngle) ? "eye_level" : "unknown";
  const cameraDistance = /macro/i.test(brief.composition.cameraDistance) ? "macro" : /close/i.test(brief.composition.cameraDistance) ? "close" : /wide/i.test(brief.composition.cameraDistance) ? "wide" : "medium";
  const subjectPlacement = /center/i.test(brief.composition.subjectPlacement) ? "centered" : /left/i.test(brief.composition.subjectPlacement) ? "rule_of_thirds_left" : /right/i.test(brief.composition.subjectPlacement) ? "rule_of_thirds_right" : "unknown";
  const lighting = /soft|diffus/i.test(brief.lighting.character) ? "soft_diffused" : /hard|direct/i.test(brief.lighting.character) ? "hard_directional" : /rim/i.test(brief.lighting.character) ? "rim_light" : /side/i.test(brief.lighting.direction) ? "side_light" : /low key|under/i.test(`${brief.lighting.ambientExposure} ${brief.lighting.contrast}`) ? "low_key" : "unknown";
  const depthOfField = /shallow|blur|bokeh/i.test(brief.depthOfField) ? "shallow" : /deep/i.test(brief.depthOfField) ? "deep" : "moderate";
  return {
    framing, cameraAngle, cameraDistance, subjectPlacement,
    productScale: framing === "macro" ? "extreme_close" : framing === "close_up" ? "large" : "medium",
    interaction: /hand|hold|worn|wear/i.test(`${brief.poseLanguage ?? ""} ${brief.visualIntent}`) ? "held" : "unknown",
    humanPose: brief.poseLanguage,
    handDirection: /top|above/i.test(brief.poseLanguage ?? "") ? "top" : /left/i.test(brief.poseLanguage ?? "") ? "left" : /right/i.test(brief.poseLanguage ?? "") ? "right" : "unknown",
    lighting,
    background: /seamless|studio/i.test(brief.environment.setting) ? "seamless_studio" : /street|urban/i.test(brief.environment.setting) ? "street" : "unknown",
    environment: brief.environment.setting,
    surfaces: brief.environment.surfaceCharacter,
    props: null,
    depthOfField,
    negativeSpace: /left/i.test(brief.composition.subjectPlacement) ? "right" : /right/i.test(brief.composition.subjectPlacement) ? "left" : "none",
    realism: /commercial/i.test(brief.realismCharacter) ? "commercial" : "photographic",
    compositionNotes: brief.visualIntent,
    nonTransferableIdentityFeatures: identityWarnings,
  };
}

export function getReferenceShotProfile(brief: ReferenceStyleBrief): ReferenceShotProfile {
  const candidate = "shotProfile" in brief ? (brief as ReferenceStyleBrief & { shotProfile?: unknown }).shotProfile : null;
  return isReferenceShotProfile(candidate) ? candidate : deriveReferenceShotProfile(brief);
}

export function renderReferenceShotProfile(profile: ReferenceShotProfile, mode: ReferenceMode): string {
  const transfer = [
    profile.framing && `primary reference framing ${profile.framing}`,
    profile.cameraAngle && `primary reference ${profile.cameraAngle} camera angle`,
    profile.cameraDistance && `primary reference ${profile.cameraDistance} camera distance`,
    profile.subjectPlacement && `primary reference ${profile.subjectPlacement} subject placement`,
    profile.productScale && `${profile.productScale} product scale`,
    profile.handDirection && profile.handDirection !== "none" && profile.handDirection !== "unknown" ? `hand entering from ${profile.handDirection}` : "",
    profile.interaction && profile.interaction !== "none" && profile.interaction !== "unknown" ? `${profile.interaction} interaction` : "",
    profile.lighting && `${profile.lighting} lighting`,
    profile.background && `${profile.background} background`,
    profile.environment,
    profile.surfaces && `${profile.surfaces} surface`,
    profile.props && `${profile.props} props`,
    profile.depthOfField && `${profile.depthOfField} depth of field`,
  ].filter(Boolean).join(", ");
  return `REFERENCE MATCH — TRANSFER ONLY SCENE STRUCTURE (${mode}): Match the reference's ${transfer || "compatible photographic direction"}. Product identity from the uploaded asset remains authoritative. Do not copy ${profile.nonTransferableIdentityFeatures.join(", ")}, or any identifiable person identity.`;
}

export function normalizeReferenceShotProfile(value: unknown): ReferenceShotProfile | null {
  return isReferenceShotProfile(value) ? { ...value, nonTransferableIdentityFeatures: value.nonTransferableIdentityFeatures.length ? value.nonTransferableIdentityFeatures : identityWarnings } : null;
}

