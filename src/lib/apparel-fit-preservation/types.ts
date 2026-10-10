export type ApparelFitProfile = {
  version: "apparel-fit-preservation-v1";
  garmentCategory: string;
  silhouette: string;
  fitType: string;
  bodyLength: string;
  sleeveLength: string;
  sleeveVolume: string;
  shoulderShape: string;
  hemStructure: string;
  cuffStructure: string;
  collarStructure: string;
  closureType: string;
  pocketCount: number | null;
  pocketPlacement: string[];
  panelStructure: string[];
  materialClass: string;
  materialFinish: string;
  drapeBehavior: string;
  rigidityLevel: string;
  textureCharacter: string;
  sourceViewCount: number;
  authoritySource: "source_product_image" | "source_product_multiview";
};

export type ApparelFitPreservationPolicy = {
  active: boolean;
  profile: ApparelFitProfile | null;
};
