import type { ReferenceMatchResolution } from "../references/resolve-reference-match";
import type { ReferenceShotProfile } from "../references/reference-shot-profile";

export type PlacementReferenceProfile = {
  framing: ReferenceShotProfile["framing"];
  cameraAngle: ReferenceShotProfile["cameraAngle"];
  cameraDistance: ReferenceShotProfile["cameraDistance"];
  subjectPlacement: ReferenceShotProfile["subjectPlacement"];
  handDirection: ReferenceShotProfile["handDirection"];
  lighting: ReferenceShotProfile["lighting"];
  background: ReferenceShotProfile["background"];
  environment: string | null;
  surface: string | null;
  depthOfField: ReferenceShotProfile["depthOfField"];
  negativeSpace: ReferenceShotProfile["negativeSpace"];
  realism: ReferenceShotProfile["realism"];
};

export type PlacementReferenceDiagnostics = {
  originalInteractionPresent: boolean;
  productTermsRemoved: boolean;
  droppedFieldNames: string[];
  retainedFieldNames: string[];
};

const productTermPattern = /\b(ring|jewelry|jewellery|gemstone|diamond|watch|footwear|shoe|product|worn|wearing|held|holding|bracelet|accessory|brand(?:ed|ing)?|logo|material|gold|silver|platinum)\b/gi;

function cleanText(value: string | null): { value: string | null; removed: boolean } {
  if (!value) return { value: null, removed: false };
  const removed = productTermPattern.test(value);
  productTermPattern.lastIndex = 0;
  const cleaned = value.replace(productTermPattern, "").replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").trim();
  return { value: cleaned || null, removed };
}

export function projectReferenceForPlacement(
  input: Pick<ReferenceMatchResolution, "shotProfile"> | null | undefined,
): { profile: PlacementReferenceProfile | null; diagnostics: PlacementReferenceDiagnostics } {
  if (!input) return { profile: null, diagnostics: { originalInteractionPresent: false, productTermsRemoved: false, droppedFieldNames: [], retainedFieldNames: [] } };
  const shot = input.shotProfile;
  const environment = cleanText(shot.environment);
  const surface = cleanText(shot.surfaces);
  const profile: PlacementReferenceProfile = {
    framing: shot.framing, cameraAngle: shot.cameraAngle, cameraDistance: shot.cameraDistance,
    subjectPlacement: shot.subjectPlacement, handDirection: shot.handDirection,
    lighting: shot.lighting, background: shot.background, environment: environment.value,
    surface: surface.value, depthOfField: shot.depthOfField, negativeSpace: shot.negativeSpace,
    realism: shot.realism,
  };
  const retainedFieldNames = Object.entries(profile)
    .filter(([, value]) => value !== null && value !== "none" && value !== "unknown")
    .map(([field]) => field);
  const droppedFieldNames = [
    "productScale", "interaction", "humanPose", "props", "compositionNotes", "nonTransferableIdentityFeatures",
    ...(environment.removed ? ["environment_product_terms"] : []),
    ...(surface.removed ? ["surfaces_product_terms"] : []),
  ];
  const originalInteractionPresent = shot.interaction !== null && shot.interaction !== "none" && shot.interaction !== "unknown";
  const hasProductBearingSemantics = originalInteractionPresent
    || shot.productScale !== null
    || shot.props !== null
    || shot.compositionNotes !== null
    || shot.nonTransferableIdentityFeatures.length > 0
    || cleanText(shot.humanPose).removed
    || environment.removed
    || surface.removed;
  return {
    profile,
    diagnostics: {
      originalInteractionPresent,
      productTermsRemoved: hasProductBearingSemantics && droppedFieldNames.length > 0,
      droppedFieldNames,
      retainedFieldNames,
    },
  };
}

export function compilePlacementReferenceDirection(profile: PlacementReferenceProfile | null): string {
  if (!profile) return "No placement reference projection is available; establish a clean, body-first composition from the creative direction.";
  const guidance = [
    profile.framing && `framing ${profile.framing}`,
    profile.cameraAngle && `${profile.cameraAngle} camera angle`,
    profile.cameraDistance && `${profile.cameraDistance} camera distance`,
    profile.subjectPlacement && `${profile.subjectPlacement} subject placement`,
    profile.handDirection && profile.handDirection !== "none" && profile.handDirection !== "unknown" && `hand entering from ${profile.handDirection}`,
    profile.lighting && `${profile.lighting} lighting`, profile.background && `${profile.background} background`,
    profile.environment && `environment: ${profile.environment}`, profile.surface && `surface: ${profile.surface}`,
    profile.depthOfField && `${profile.depthOfField} depth of field`,
    profile.negativeSpace && profile.negativeSpace !== "none" && `${profile.negativeSpace} negative space`,
    profile.realism && `${profile.realism} realism`,
  ].filter(Boolean);
  return `PLACEMENT REFERENCE — match body pose and camera structure only: ${guidance.join("; ")}.`;
}
