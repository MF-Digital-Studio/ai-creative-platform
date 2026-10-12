export type ApparelFitProfile = {
  version: "apparel-fit-preservation-v1";
  garmentCategory: string | null;
  silhouette: string | null;
  fitType: string | null;
  bodyLength: string | null;
  sleeveLength: string | null;
  sleeveVolume: string | null;
  shoulderShape: string | null;
  hemStructure: string | null;
  cuffStructure: string | null;
  collarStructure: string | null;
  closureType: string | null;
  pocketCount: number | null;
  pocketPlacement: string[];
  panelStructure: string[];
  materialClass: string | null;
  materialFinish: string | null;
  drapeBehavior: string | null;
  rigidityLevel: string | null;
  textureCharacter: string | null;
  sourceViewCount: number;
  authoritySource: "product_profile" | "source_product_fallback" | "source_product_image" | "source_product_multiview";
  confidence: "high" | "limited";
};

export type ApparelFitPreservationPolicy = {
  active: boolean;
  profile: ApparelFitProfile | null;
};
