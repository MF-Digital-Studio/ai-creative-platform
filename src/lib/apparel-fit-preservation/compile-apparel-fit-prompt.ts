import type { ApparelFitPreservationPolicy } from "./types";

export function compileApparelFitPreservationPrompt(policy: ApparelFitPreservationPolicy, referenceAuthority: boolean): string {
  if (!policy.active || !policy.profile) return "";
  const p = policy.profile;
  return [
    "APPAREL FIT PRESERVATION V1 — BINDING SOURCE GARMENT AUTHORITY: Dress the model in the same source SKU, not an inspired or fashionized variation. Source product images govern garment identity, fit, silhouette, proportions, construction, length, placement, material behavior, and surface finish.",
    `RESOLVED FIT PROFILE (${p.authoritySource}, ${p.sourceViewCount} view${p.sourceViewCount === 1 ? "" : "s"}): garment=${p.garmentCategory}; silhouette=${p.silhouette}; fit=${p.fitType}; bodyLength=${p.bodyLength}; sleeveLength=${p.sleeveLength}; sleeveVolume=${p.sleeveVolume}; shoulder=${p.shoulderShape}; hem=${p.hemStructure}; cuff=${p.cuffStructure}; collar=${p.collarStructure}; closure=${p.closureType}; pockets=${p.pocketCount ?? "source-visible"} [${p.pocketPlacement.join("; ") || "source-image authority"}]; panels=${p.panelStructure.join("; ") || "source-image authority"}; material=${p.materialClass}; finish=${p.materialFinish}; drape=${p.drapeBehavior}; rigidity=${p.rigidityLevel}; texture=${p.textureCharacter}.`,
    "Preserve exact garment proportions, shoulder width/drop, sleeve cut/volume/length, body width and torso fall, crop/waist endpoint, trouser leg length when applicable, hem/waistband/rib/cuff construction, collar geometry/height, zipper/button/placket line and puller position, pocket count/position/size/angle, seams, panels, logo/artwork/patch/hardware placement, and original material stiffness, wrinkle behavior, sheen and texture.",
    "Allow only physically necessary body curvature, gravity folds, pressure and occlusion. Do not slim, sharpen, tailor, crop, lengthen, widen, restructure, or editorially reinterpret the garment; never turn oversized/boxy/relaxed into fitted/tailored, or structured/stiff material into fluid fabric.",
    "NEGATIVE FIT CONSTRAINTS: no silhouette slimming, fit-category conversion, moved/resized pockets, changed hem depth, rib, cuff, waistband, collar, sleeve cut, closure geometry, panel layout, material type, finish, stiffness, or drape character.",
    referenceAuthority ? "AUTHORITY: Reference 1 may control person pose, body orientation, camera, framing, composition and environment only. It must not transfer the reference garment fit or reshape the source garment." : "",
  ].filter(Boolean).join("\n");
}
