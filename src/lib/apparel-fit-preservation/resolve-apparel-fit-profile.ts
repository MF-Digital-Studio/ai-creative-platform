import { isProductProfile } from "@/lib/product-understanding/product-profile";
import type { GenerationStrategy } from "@/lib/generation/strategy/generation-strategy";
import { APPAREL_FIT_PRESERVATION_VERSION } from "./apparel-fit-version";
import type { ApparelFitPreservationPolicy, ApparelFitProfile } from "./types";

function find(values: readonly string[], pattern: RegExp, fallback = "source-image authority"): string {
  return values.find((value) => pattern.test(value)) ?? fallback;
}

export function resolveApparelFitProfile(profile: unknown, sourceViewCount = 1): ApparelFitProfile | null {
  if (!isProductProfile(profile) || profile.vertical !== "apparel" || profile.verticalAttributes.vertical !== "apparel") return null;
  const details = profile.verticalAttributes.details;
  const construction = details.constructionDetails;
  const materials = profile.materials;
  const pockets = details.pocketStructure;
  return {
    version: APPAREL_FIT_PRESERVATION_VERSION,
    garmentCategory: details.garmentType,
    silhouette: find(construction, /silhouette|boxy|slim|straight|oversized|cropped|relaxed|fitted/i, profile.productShape),
    fitType: find(construction, /\bfit\b|boxy|slim|straight|oversized|relaxed|fitted/i),
    bodyLength: find(construction, /body length|crop|waist|hip length|longline|length/i),
    sleeveLength: find(construction, /sleeve length|short sleeve|long sleeve|sleeveless|three.quarter/i),
    sleeveVolume: find(construction, /sleeve volume|wide sleeve|balloon|tapered sleeve|slim sleeve|drop sleeve/i),
    shoulderShape: find(construction, /shoulder|raglan|drop shoulder|set.in/i),
    hemStructure: find(construction, /hem|waistband|ribbed bottom|elastic bottom/i),
    cuffStructure: find(construction, /cuff|wrist rib|elastic wrist/i),
    collarStructure: details.hoodOrCollar ?? "source-image authority",
    closureType: details.closures.join("; ") || "none visible / source-image authority",
    pocketCount: pockets.length || null,
    pocketPlacement: pockets,
    panelStructure: construction.filter((value) => /panel|seam|yoke|dart|stitch/i.test(value)),
    materialClass: materials.join("; ") || "source-image authority",
    materialFinish: find([...materials, ...construction], /matte|gloss|shine|washed|coated|satin|brushed|finish/i),
    drapeBehavior: find(construction, /drape|fluid|structured|stiff|soft|flow|fall/i, profile.rigidity === "deformable" ? "soft natural source drape" : "structured source drape"),
    rigidityLevel: profile.rigidity,
    textureCharacter: find([...materials, ...construction], /texture|grain|knit|denim|leather|nylon|satin|cotton|rib/i),
    sourceViewCount: Math.max(1, sourceViewCount),
    authoritySource: "product_profile",
    confidence: "high",
  };
}

function sourceFallbackProfile(sourceViewCount: number): ApparelFitProfile {
  return {
    version: APPAREL_FIT_PRESERVATION_VERSION,
    garmentCategory: null, silhouette: null, fitType: null, bodyLength: null, sleeveLength: null,
    sleeveVolume: null, shoulderShape: null, hemStructure: null, cuffStructure: null, collarStructure: null,
    closureType: null, pocketCount: null, pocketPlacement: [], panelStructure: [], materialClass: null,
    materialFinish: null, drapeBehavior: null, rigidityLevel: null, textureCharacter: null,
    sourceViewCount: Math.max(1, sourceViewCount), authoritySource: "source_product_fallback", confidence: "limited",
  };
}

export function resolveApparelFitPreservation(input: {
  profile: unknown;
  strategy: GenerationStrategy;
  humanExpected: boolean;
  productOnly: boolean;
  vertical?: string | null;
  sourceProductExists?: boolean;
  presentationMode?: string | null;
  sourceViewCount?: number;
  requiresApparelFit?: boolean;
}): ApparelFitPreservationPolicy {
  const validProfile = resolveApparelFitProfile(input.profile, input.sourceViewCount);
  const profile = validProfile ?? (input.vertical === "apparel" && input.sourceProductExists ? sourceFallbackProfile(input.sourceViewCount ?? 1) : null);
  const active = input.vertical === "apparel" && input.sourceProductExists === true && input.humanExpected && input.requiresApparelFit !== false && !input.productOnly;
  return { profile, active };
}
