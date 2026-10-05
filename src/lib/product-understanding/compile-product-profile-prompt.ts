import type { ProductProfile } from "./types";
import type { ProductRegion } from "./vertical-attributes";

export type ProductProfilePrompt = {
  forbidden: string[];
  identity: string[];
  interaction: string[];
  presentation: string[];
};

const forbiddenLabels: Record<ProductProfile["forbiddenTransformations"][number], string> = {
  recolor: "Do not change the product color.",
  logo_movement: "Do not move, remove, or redesign logos.",
  geometry_redesign: "Do not redesign product geometry or proportions.",
  gemstone_count_change: "Do not change gemstone count or arrangement.",
  dial_layout_change: "Do not redesign the dial layout.",
  outsole_redesign: "Do not redesign the outsole.",
  label_redesign: "Do not redesign labels.",
  text_or_artwork_change: "Do not change text or artwork.",
  packaging_redesign: "Do not redesign packaging or dispenser parts.",
};

function addIfPresent(rules: string[], value: string | null, template: (value: string) => string) {
  if (value?.trim()) rules.push(template(value.trim()));
}

function hasRegions(regions: ProductRegion[]) {
  return regions.length > 0;
}

function isType(profile: ProductProfile, type: string) {
  const subcategory = profile.subcategory?.toLowerCase() ?? "";
  const details = profile.verticalAttributes.details;
  const attributeType = "jewelryType" in details ? details.jewelryType : "";
  return subcategory.includes(type) || attributeType.toLowerCase().includes(type);
}

/** Compiles validated product evidence into deterministic provider-prompt fragments. */
export function compileProductProfilePrompt(profile: ProductProfile): ProductProfilePrompt {
  const identity = [
    "PRODUCT IDENTITY — NON-NEGOTIABLE: Preserve the exact visible product identity from the supplied source image.",
    "Preserve visible colors, geometry, proportions, and identity-critical attributes; only allow transformations explicitly listed below.",
  ];
  const interaction: string[] = [];
  const forbidden = profile.forbiddenTransformations.map((item) => forbiddenLabels[item]);
  const presentation: string[] = [];

  if (profile.dominantColors.length) identity.push(`Preserve the visible product colors: ${profile.dominantColors.join(", ")}.`);
  if (profile.identityCriticalAttributes.length) {
    identity.push(`Preserve identity-critical details: ${profile.identityCriticalAttributes.map(({ attribute }) => attribute).join("; ")}.`);
  }
  if (profile.visibleBranding.hasLogo || profile.visibleBranding.hasReadableText || profile.visibleBranding.hasArtwork) {
    identity.push("Preserve all visible logo, readable text, and artwork regions in their original placement.");
  }
  if (profile.allowedTransformations.length && !profile.allowedTransformations.includes("none")) {
    presentation.push(`Allowed transformations only: ${profile.allowedTransformations.join(", ").replaceAll("_", " ")}.`);
  }

  const attributes = profile.verticalAttributes;
  if (attributes.vertical === "jewelry") {
    const details = attributes.details;
    addIfPresent(identity, details.jewelryType, (value) => `Preserve the ${value} type and exact jewelry design.`);
    addIfPresent(identity, details.metalColorOrMaterial, (value) => `Preserve the ${value} metal/material appearance.`);
    if (details.centerStone) {
      addIfPresent(identity, details.centerStoneShape, (value) => `Preserve the center stone shape: ${value}.`);
      addIfPresent(identity, details.centerStoneColor, (value) => `Preserve the center stone color: ${value}.`);
    }
    if (details.stoneCount !== null) identity.push(`Preserve the stone count: ${details.stoneCount}.`);
    addIfPresent(identity, details.stoneLayout, (value) => `Preserve the stone layout: ${value}.`);
    addIfPresent(identity, details.settingStyle, (value) => `Preserve the setting: ${value}.`);
    addIfPresent(identity, details.bandOrChainStructure, (value) => `Preserve the visible band or chain structure: ${value}.`);
    presentation.push("Jewelry must remain the large, sharply readable hero subject.");
    if (isType(profile, "ring")) {
      interaction.push("The ring must wrap naturally around a finger with realistic skin contact and occlusion.", "Preserve band thickness, complete band geometry, stone arrangement, and center-stone orientation.");
      forbidden.push("No floating or pasted-on ring, no broken or open ring geometry unless the source product is open.");
    } else if (isType(profile, "necklace")) {
      interaction.push("The chain must follow neck/body curvature and gravity; preserve pendant placement.");
      forbidden.push("No floating chain.");
    } else if (isType(profile, "bracelet")) {
      interaction.push("The bracelet must wrap naturally around the wrist; preserve visible clasp and chain structure.");
    } else if (isType(profile, "earring")) {
      interaction.push("The earring must attach physically correctly at the ear.");
      forbidden.push("No floating or duplicated earring pieces.");
    }
  } else if (attributes.vertical === "watches") {
    const details = attributes.details;
    addIfPresent(identity, details.caseShape, (value) => `Preserve case shape: ${value}.`); addIfPresent(identity, details.caseMaterialOrColor, (value) => `Preserve case material/color: ${value}.`);
    addIfPresent(identity, details.dialColor, (value) => `Preserve dial color: ${value}.`); addIfPresent(identity, details.bezel, (value) => `Preserve bezel: ${value}.`);
    if (details.crownSide !== "not_visible") identity.push(`Preserve crown side: ${details.crownSide}.`);
    addIfPresent(identity, details.pushers, (value) => `Preserve pushers: ${value}.`); addIfPresent(identity, details.braceletOrStrap, (value) => `Preserve bracelet/strap: ${value}.`);
    addIfPresent(identity, details.indicesOrMarkers, (value) => `Preserve indices and markers: ${value}.`); addIfPresent(identity, details.dateWindow, (value) => `Preserve date window: ${value}.`); addIfPresent(identity, details.subdials, (value) => `Preserve subdial structure: ${value}.`);
    if (hasRegions(details.dialBrandingRegions)) identity.push("Preserve visible dial branding regions; do not invent prominent microtext.");
    interaction.push("On a wrist, the watch must sit naturally with correctly curved bracelet/strap, realistic scale, and no skin clipping."); presentation.push("The watch must remain visually dominant."); forbidden.push("No extra markers or subdials, missing crown, dial redesign, or warped bracelet.");
  } else if (attributes.vertical === "footwear") {
    const details = attributes.details;
    addIfPresent(identity, details.silhouette, (value) => `Preserve footwear silhouette: ${value}.`); addIfPresent(identity, details.outsole, (value) => `Preserve outsole: ${value}.`); addIfPresent(identity, details.midsole, (value) => `Preserve midsole: ${value}.`);
    if (details.panelStructure.length) identity.push(`Preserve upper panel structure: ${details.panelStructure.join(", ")}.`); addIfPresent(identity, details.lacing, (value) => `Preserve lacing: ${value}.`); addIfPresent(identity, details.tongue, (value) => `Preserve tongue: ${value}.`); addIfPresent(identity, details.heel, (value) => `Preserve heel: ${value}.`);
    if (details.colorBlocking.length) identity.push(`Preserve color blocking: ${details.colorBlocking.join(", ")}.`); if (hasRegions(details.logoRegions)) identity.push("Preserve visible footwear logo placement.");
    interaction.push("On-foot, ensure realistic fit and natural ground contact."); presentation.push("Footwear must remain the hero subject."); forbidden.push("No warped sole or toe box, panel redesign, or lace corruption.");
  } else if (attributes.vertical === "bags") {
    const details = attributes.details;
    identity.push(`Preserve bag type: ${details.bagType}.`);
    addIfPresent(identity, details.silhouette, (value) => `Preserve exact bag silhouette: ${value}.`);
    addIfPresent(identity, details.proportions, (value) => `Preserve bag body proportions: ${value}.`);
    addIfPresent(identity, details.bodyStructure, (value) => `Preserve body structure: ${value}.`);
    if (details.handleCount !== null) identity.push(`Preserve handle count exactly: ${details.handleCount}.`);
    addIfPresent(identity, details.handleGeometry, (value) => `Preserve handle geometry and attachment points: ${value}; ${details.handleAttachmentPoints.join(", ")}.`);
    if (details.strapCount !== null) identity.push(`Preserve strap count exactly: ${details.strapCount}.`);
    if (details.strapPlacement.length) identity.push(`Preserve strap presence and placement: ${details.strapPlacement.join(", ")}.`);
    addIfPresent(identity, details.strapWidth, (value) => `Preserve strap width: ${value}.`);
    addIfPresent(identity, details.strapLengthClass, (value) => `Preserve strap length class: ${value}.`);
    addIfPresent(identity, details.closureType, (value) => `Preserve closure type and geometry: ${value}.`);
    addIfPresent(identity, details.flapOrOpeningShape, (value) => `Preserve flap/opening shape: ${value}.`);
    if (details.zipperLayout.length) identity.push(`Preserve zipper layout: ${details.zipperLayout.join(", ")}.`);
    if (details.pocketLayout.length) identity.push(`Preserve pocket layout: ${details.pocketLayout.join(", ")}.`);
    if (details.panelConstruction.length) identity.push(`Preserve panel seams and construction: ${details.panelConstruction.join(", ")}.`);
    addIfPresent(identity, details.stitchingPattern, (value) => `Preserve stitching pattern: ${value}.`);
    addIfPresent(identity, details.pipingOrEdgeTreatment, (value) => `Preserve piping/edge treatment: ${value}.`);
    if (details.hardwareLayout.length) identity.push(`Preserve hardware positions: ${details.hardwareLayout.join(", ")}.`);
    addIfPresent(identity, details.hardwareColor, (value) => `Preserve hardware color: ${value}.`);
    addIfPresent(identity, details.material, (value) => `Preserve material identity: ${value}.`);
    addIfPresent(identity, details.materialTexture, (value) => `Preserve material texture: ${value}.`);
    if (details.colorBlocking.length) identity.push(`Preserve color blocking: ${details.colorBlocking.join(", ")}.`);
    addIfPresent(identity, details.patternOrPrint, (value) => `Preserve pattern/print: ${value}.`);
    addIfPresent(identity, details.baseShape, (value) => `Preserve base shape: ${value}.`);
    addIfPresent(identity, details.baseFeetHardware, (value) => `Preserve base feet/hardware: ${value}.`);
    if (details.chainStrap !== null) identity.push(`Preserve chain strap presence: ${details.chainStrap ? "present" : "absent"}.`);
    if (hasRegions(details.logoOrMonogramPlacement)) identity.push("Preserve logo/monogram design and exact visible placement.");
    interaction.push("For on-model carry, use natural hand/finger grip or shoulder/crossbody contact, credible bag weight and gravity, and physically plausible strap tension. Do not let the body hide the main body, handles, closure, logo, or distinctive hardware.");
    presentation.push("Keep the full bag body and identity-critical handles, straps, closure, logo, and hardware visible. Preserve structured geometry; allow only natural soft-bag compression, strap bend, folds, and perspective.");
    forbidden.push("Do not add/remove handles, straps, pockets, zippers, closures, hardware, seams, logos, or charms; do not change bag type, flap, proportions, color, material, or construction.");
  } else if (attributes.vertical === "apparel") {
    const details = attributes.details;
    identity.push(`Preserve garment type: ${details.garmentType}.`); addIfPresent(identity, details.primaryColor, (value) => `Preserve garment color: ${value}.`);
    if (hasRegions(details.artworkOrLogoLocations)) identity.push("Preserve artwork and logo placement."); if (details.closures.length) identity.push(`Preserve closures: ${details.closures.join(", ")}.`); if (details.pocketStructure.length) identity.push(`Preserve pocket structure: ${details.pocketStructure.join(", ")}.`); addIfPresent(identity, details.hoodOrCollar, (value) => `Preserve hood/collar: ${value}.`); if (details.constructionDetails.length) identity.push(`Preserve seams and construction: ${details.constructionDetails.join(", ")}.`);
    presentation.push("Natural fabric deformation, folds, body fitting, and perspective are allowed."); forbidden.push("No print relocation, recoloring, closure/pocket changes, or structural redesign.");
  } else if (attributes.vertical === "cosmetics") {
    const details = attributes.details;
    identity.push(`Preserve ${details.packageType} packaging and ${details.containerForm} container form.`); addIfPresent(identity, details.packageGeometry, (value) => `Preserve package geometry: ${value}.`);
    identity.push(`Preserve ${details.closureOrDispenser} dispenser structure, ${details.materialOpacity} material behavior, and ${details.liquidVisibility.replaceAll("_", " ")} liquid visibility.`);
    if (hasRegions(details.labelRegions) || hasRegions(details.logoRegions)) identity.push("Preserve label and logo placement."); forbidden.push("No packaging geometry changes, label relocation, invented branding, or dispenser parts.");
  }

  return { identity, interaction, forbidden: [...new Set(forbidden)], presentation };
}
