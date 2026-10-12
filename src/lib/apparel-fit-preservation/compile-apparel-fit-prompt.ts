import type { ApparelFitPreservationPolicy } from "./types";

export function compileApparelFitPreservationPrompt(policy: ApparelFitPreservationPolicy, referenceAuthority: boolean): string {
  if (!policy.active || !policy.profile) return "";
  const p = policy.profile;
  return [
    "APPAREL FIT PRESERVATION V1 — BINDING SOURCE GARMENT AUTHORITY: Dress the model in the same source SKU, not an inspired or fashionized variation. Source product images govern garment identity, fit, silhouette, proportions, construction, length, placement, material behavior, and surface finish.",
    `RESOLVED FIT PROFILE (${p.authoritySource}, confidence=${p.confidence}, ${p.sourceViewCount} view${p.sourceViewCount === 1 ? "" : "s"}): garment=${p.garmentCategory ?? "source image"}; silhouette=${p.silhouette ?? "unknown"}; fit=${p.fitType ?? "unknown"}; bodyLength=${p.bodyLength ?? "unknown"}; sleeveLength=${p.sleeveLength ?? "unknown"}; sleeveVolume=${p.sleeveVolume ?? "unknown"}; shoulder=${p.shoulderShape ?? "unknown"}; hem=${p.hemStructure ?? "unknown"}; cuff=${p.cuffStructure ?? "unknown"}; collar=${p.collarStructure ?? "unknown"}; closure=${p.closureType ?? "unknown"}; pockets=${p.pocketCount ?? "unknown"} [${p.pocketPlacement.join("; ") || "unknown"}]; panels=${p.panelStructure.join("; ") || "unknown"}; material=${p.materialClass ?? "unknown"}; finish=${p.materialFinish ?? "unknown"}; drape=${p.drapeBehavior ?? "unknown"}; rigidity=${p.rigidityLevel ?? "unknown"}; texture=${p.textureCharacter ?? "unknown"}.`,
    "Same garment from source image. Do not redesign or restyle garment fit/construction.",
    "Preserve exact garment proportions, shoulder width/drop, sleeve cut/volume/length, body width and torso fall, crop/waist endpoint, trouser leg length when applicable, hem/waistband/rib/cuff construction, collar geometry/height, zipper/button/placket line and puller position, pocket count/position/size/angle, seams, panels, logo/artwork/patch/hardware placement, and original material stiffness, wrinkle behavior, sheen and texture.",
    "Allow only physically necessary body curvature, gravity folds, pressure and occlusion. Do not slim, sharpen, tailor, crop, lengthen, widen, restructure, or editorially reinterpret the garment; never turn oversized/boxy/relaxed into fitted/tailored, or structured/stiff material into fluid fabric.",
    "NEGATIVE FIT CONSTRAINTS: no silhouette slimming, fit-category conversion, moved/resized pockets, changed hem depth, rib, cuff, waistband, collar, sleeve cut, closure geometry, panel layout, material type, finish, stiffness, or drape character.",
    referenceAuthority ? "AUTHORITY: Reference 1 may control person pose, body orientation, camera, framing, composition and environment only. It must not transfer the reference garment fit or reshape the source garment." : "",
  ].filter(Boolean).join("\n");
}
