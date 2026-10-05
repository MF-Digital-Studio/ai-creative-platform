import type { CompositionProfile } from "@/lib/composition-intelligence/types";
import type { CreativeComplianceResolution } from "@/lib/creative-direction-compliance/types";
import type { ProductProfile } from "@/lib/product-understanding/product-profile";
import type { SceneFamily } from "@/lib/scene-suitability/types";

import { getReferenceShotProfile, type ReferenceMode, type ReferenceShotProfile } from "./reference-shot-profile";
import type { ReferenceStyleBrief } from "./reference-style-brief";

export type ReferenceMatchResolution = {
  mode: ReferenceMode;
  compatible: boolean;
  transferableAttributes: string[];
  blockedAttributes: string[];
  compositionAdjustments: string[];
  interactionAdjustments: string[];
  styleAdjustments: string[];
  shotProfile: ReferenceShotProfile;
};

function isCompatible(profile: ProductProfile | null | undefined, sceneFamily: SceneFamily | null | undefined, shot: ReferenceShotProfile): boolean {
  if (!profile || !sceneFamily) return true;
  const vertical = sceneFamily.split("_")[0];
  if (vertical !== profile.vertical && !(profile.vertical === "watches" && vertical === "watch")) return false;
  if (profile.vertical === "jewelry" && shot.framing === "environmental" && shot.productScale === "contextual") return false;
  if ((profile.vertical === "jewelry" || profile.vertical === "watches") && shot.cameraDistance === "wide") return false;
  return true;
}

export function resolveReferenceMatch(input: {
  productProfile?: ProductProfile | null;
  sceneFamily?: SceneFamily | null;
  composition?: CompositionProfile | null;
  creativeCompliance?: CreativeComplianceResolution | null;
  reference?: ReferenceStyleBrief | ReferenceShotProfile | null;
  mode?: ReferenceMode;
}): ReferenceMatchResolution | null {
  if (!input.reference) return null;
  const shot = "nonTransferableIdentityFeatures" in input.reference ? input.reference : getReferenceShotProfile(input.reference);
  const mode = input.mode ?? "inspired";
  const compatible = isCompatible(input.productProfile, input.sceneFamily, shot);
  const compositionAdjustments = compatible && input.composition ? [
    shot.framing ? `preserve primary reference ${shot.framing} framing within the product-safe output canvas` : "",
    shot.cameraAngle ? `preserve the primary reference ${shot.cameraAngle} camera angle when physically compatible` : "",
    shot.subjectPlacement ? `preserve primary reference ${shot.subjectPlacement} subject placement without reducing product visibility` : "",
    shot.negativeSpace && shot.negativeSpace !== "none" ? `retain primary reference ${shot.negativeSpace} negative space` : "",
  ].filter(Boolean) : [];
  const interactionAdjustments = compatible ? [
    shot.handDirection && shot.handDirection !== "none" && shot.handDirection !== "unknown" ? `hand enters from ${shot.handDirection}` : "",
    shot.interaction && shot.interaction !== "none" && shot.interaction !== "unknown" ? `use ${shot.interaction} interaction structure` : "",
    shot.humanPose ? `preserve primary reference pose structure: ${shot.humanPose}` : "",
  ].filter(Boolean) : [];
  const styleAdjustments = compatible ? [
    shot.lighting && shot.lighting !== "unknown" ? `${shot.lighting} lighting` : "",
    shot.background && shot.background !== "unknown" ? `${shot.background} background/environment` : "",
    shot.surfaces ?? "",
    shot.props ?? "",
    shot.depthOfField ? `${shot.depthOfField} depth of field` : "",
  ].filter(Boolean) : [];
  const transferableAttributes = [...compositionAdjustments, ...interactionAdjustments, ...styleAdjustments];
  return {
    mode,
    compatible,
    transferableAttributes: mode === "match" ? transferableAttributes : transferableAttributes.slice(0, 4),
    blockedAttributes: [
      "reference product logo, brand name, labels, text, and artwork",
      "reference product color when it conflicts with the uploaded product",
      "reference product geometry, packaging, stone layout, watch dial, shoe panels, and garment construction",
      "identifiable person identity",
    ],
    compositionAdjustments: mode === "match" ? compositionAdjustments : compositionAdjustments.slice(0, 2),
    interactionAdjustments: mode === "match" ? interactionAdjustments : interactionAdjustments.slice(0, 1),
    styleAdjustments,
    shotProfile: shot,
  };
}
