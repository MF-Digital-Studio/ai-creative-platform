import { isProductProfile } from "@/lib/product-understanding/product-profile";

import { PRODUCT_IDENTITY_LOCK_VERSION } from "./identity-lock-version";
import type { ProductIdentityManifest } from "./types";

function push(values: string[], value: string | null | undefined, label: string) {
  if (value?.trim()) values.push(`${label}: ${value.trim()}`);
}

export function buildProductIdentityManifest(profile: unknown): ProductIdentityManifest {
  if (!isProductProfile(profile)) {
    return {
      version: PRODUCT_IDENTITY_LOCK_VERSION, vertical: "product", subcategory: null,
      immutableAttributes: ["visible source product design"], geometryAnchors: ["visible source silhouette and component proportions"],
      colorMaterialAnchors: ["visible source colors and material appearance"], brandingAnchors: [], interactionSensitiveAttributes: [],
      allowedDeformations: [], forbiddenChanges: ["substitute a similar product", "redesign visible geometry", "change visible branding"],
    };
  }
  const immutableAttributes = [
    `product type: ${profile.subcategory ?? profile.productShape}`,
    ...profile.identityCriticalAttributes.map(({ attribute }) => attribute),
  ];
  const geometryAnchors: string[] = [];
  const colorMaterialAnchors = [...profile.dominantColors.map((color) => `color: ${color}`), ...profile.materials.map((material) => `material: ${material}`)];
  const brandingAnchors = profile.visibleBranding.hasLogo || profile.visibleBranding.hasReadableText || profile.visibleBranding.hasArtwork
    ? ["visible logo, text, and artwork regions remain in their source placement"] : [];
  const interactionSensitiveAttributes: string[] = [];
  if (profile.verticalAttributes.vertical === "jewelry") {
    const details = profile.verticalAttributes.details;
    push(immutableAttributes, details.jewelryType, "jewelry type"); push(colorMaterialAnchors, details.metalColorOrMaterial, "metal/material");
    if (details.centerStone) { push(geometryAnchors, details.centerStoneShape, "center stone shape"); push(colorMaterialAnchors, details.centerStoneColor, "center stone color"); }
    if (details.stoneCount !== null) geometryAnchors.push(`stone count: ${details.stoneCount}`);
    push(geometryAnchors, details.stoneLayout, "stone layout"); push(geometryAnchors, details.settingStyle, "setting/prong structure"); push(geometryAnchors, details.bandOrChainStructure, "band/chain geometry");
    interactionSensitiveAttributes.push(`body target: ${details.bodyPlacementTarget}`, "preserve complete visible band/chain geometry during natural contact and occlusion");
  } else if (profile.verticalAttributes.vertical === "watches") {
    const details = profile.verticalAttributes.details;
    push(geometryAnchors, details.caseShape, "case silhouette"); push(colorMaterialAnchors, details.caseMaterialOrColor, "case material/color"); push(colorMaterialAnchors, details.dialColor, "dial color"); push(geometryAnchors, details.bezel, "bezel"); push(geometryAnchors, details.pushers, "pushers"); push(geometryAnchors, details.braceletOrStrap, "bracelet/strap"); push(geometryAnchors, details.indicesOrMarkers, "indices/markers"); push(geometryAnchors, details.dateWindow, "date window"); push(geometryAnchors, details.subdials, "subdial structure"); if (details.crownSide !== "not_visible") geometryAnchors.push(`crown side: ${details.crownSide}`);
  } else if (profile.verticalAttributes.vertical === "footwear") {
    const details = profile.verticalAttributes.details;
    push(geometryAnchors, details.silhouette, "silhouette"); push(geometryAnchors, details.outsole, "outsole"); push(geometryAnchors, details.midsole, "midsole"); push(geometryAnchors, details.lacing, "lacing"); push(geometryAnchors, details.tongue, "tongue"); push(geometryAnchors, details.heel, "heel"); geometryAnchors.push(...details.panelStructure.map((panel) => `panel boundary: ${panel}`)); colorMaterialAnchors.push(...details.colorBlocking.map((color) => `color blocking: ${color}`));
  } else if (profile.verticalAttributes.vertical === "bags") {
    const details = profile.verticalAttributes.details;
    immutableAttributes.push(`bag type: ${details.bagType}`);
    push(geometryAnchors, details.silhouette, "silhouette"); push(geometryAnchors, details.proportions, "overall proportions"); push(geometryAnchors, details.bodyStructure, "body structure");
    if (details.handleCount !== null) geometryAnchors.push(`handle count: ${details.handleCount}`);
    push(geometryAnchors, details.handleGeometry, "handle geometry"); geometryAnchors.push(...details.handleAttachmentPoints.map((value) => `handle attachment: ${value}`));
    if (details.strapCount !== null) geometryAnchors.push(`strap count: ${details.strapCount}`);
    geometryAnchors.push(...details.strapPlacement.map((value) => `strap placement: ${value}`));
    push(geometryAnchors, details.strapWidth, "strap width"); push(geometryAnchors, details.strapLengthClass, "strap length class");
    push(geometryAnchors, details.closureType, "closure geometry"); push(geometryAnchors, details.flapOrOpeningShape, "flap/opening shape");
    geometryAnchors.push(...details.zipperLayout.map((value) => `zipper: ${value}`), ...details.pocketLayout.map((value) => `pocket: ${value}`), ...details.panelConstruction.map((value) => `panel seam: ${value}`));
    push(geometryAnchors, details.stitchingPattern, "stitching"); push(geometryAnchors, details.pipingOrEdgeTreatment, "edge treatment");
    geometryAnchors.push(...details.hardwareLayout.map((value) => `hardware position: ${value}`)); push(colorMaterialAnchors, details.hardwareColor, "hardware color");
    push(colorMaterialAnchors, details.material, "material identity"); push(colorMaterialAnchors, details.materialTexture, "material texture");
    colorMaterialAnchors.push(...details.colorBlocking.map((value) => `color blocking: ${value}`)); push(geometryAnchors, details.patternOrPrint, "pattern/print");
    push(geometryAnchors, details.baseShape, "base shape"); push(geometryAnchors, details.baseFeetHardware, "base feet/hardware");
    if (details.chainStrap !== null) geometryAnchors.push(`chain strap: ${details.chainStrap ? "present" : "absent"}`);
    brandingAnchors.push(...details.logoOrMonogramPlacement.map(({ location, description }) => `logo/monogram at ${location}: ${description}`));
    geometryAnchors.push(...details.decorativeCharms.map((value) => `charm: ${value}`), ...details.asymmetricDetails.map((value) => `asymmetric detail: ${value}`));
    interactionSensitiveAttributes.push("preserve realistic handle/strap grip, shoulder or crossbody contact, bag weight, gravity, and strap tension; do not fuse fingers or pass straps through the torso");
  } else if (profile.verticalAttributes.vertical === "apparel") {
    const details = profile.verticalAttributes.details;
    immutableAttributes.push(`garment type: ${details.garmentType}`); push(colorMaterialAnchors, details.primaryColor, "primary color"); geometryAnchors.push(...details.closures.map((closure) => `closure: ${closure}`), ...details.pocketStructure.map((pocket) => `pocket: ${pocket}`), ...details.constructionDetails.map((detail) => `construction: ${detail}`)); push(geometryAnchors, details.hoodOrCollar, "hood/collar"); brandingAnchors.push(...details.artworkOrLogoLocations.map(({ location, description }) => `artwork/logo at ${location}: ${description}`));
  } else {
    const details = profile.verticalAttributes.details;
    immutableAttributes.push(`package type: ${details.packageType}`, `container form: ${details.containerForm}`, `dispenser: ${details.closureOrDispenser}`); push(geometryAnchors, details.packageGeometry, "outer package geometry"); colorMaterialAnchors.push(`material opacity: ${details.materialOpacity}`, `liquid visibility: ${details.liquidVisibility}`); brandingAnchors.push(...details.labelRegions.map(({ location, description }) => `label at ${location}: ${description}`), ...details.logoRegions.map(({ location, description }) => `logo at ${location}: ${description}`));
  }
  return {
    version: PRODUCT_IDENTITY_LOCK_VERSION, vertical: profile.vertical, subcategory: profile.subcategory,
    immutableAttributes: [...new Set(immutableAttributes)], geometryAnchors: [...new Set(geometryAnchors)], colorMaterialAnchors: [...new Set(colorMaterialAnchors)], brandingAnchors: [...new Set(brandingAnchors)], interactionSensitiveAttributes: [...new Set(interactionSensitiveAttributes)],
    allowedDeformations: profile.allowedTransformations,
    forbiddenChanges: ["substitute a similar product", "invent, simplify, remove, duplicate, or relocate identity-critical components", ...profile.forbiddenTransformations.map((item) => item.replaceAll("_", " "))],
  };
}
