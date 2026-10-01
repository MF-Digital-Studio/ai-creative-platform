export type ProductRegion = {
  description: string;
  location: string;
};

export type ApparelAttributes = {
  garmentType: string;
  primaryColor: string | null;
  artworkOrLogoLocations: ProductRegion[];
  closures: string[];
  pocketStructure: string[];
  hoodOrCollar: string | null;
  constructionDetails: string[];
  identitySides: Array<"front" | "back">;
};

export type JewelryAttributes = {
  jewelryType: string;
  metalColorOrMaterial: string | null;
  centerStone: boolean | null;
  centerStoneShape: string | null;
  centerStoneColor: string | null;
  stoneCount: number | null;
  stoneLayout: string | null;
  settingStyle: string | null;
  bandOrChainStructure: string | null;
  bodyPlacementTarget: "finger" | "wrist" | "neck" | "ear" | "other" | "none";
};

export type WatchAttributes = {
  caseShape: string | null;
  caseMaterialOrColor: string | null;
  dialColor: string | null;
  bezel: string | null;
  crownSide: "left" | "right" | "other" | "not_visible";
  pushers: string | null;
  braceletOrStrap: string | null;
  indicesOrMarkers: string | null;
  dateWindow: string | null;
  subdials: string | null;
  dialBrandingRegions: ProductRegion[];
};

export type CosmeticsAttributes = {
  packageType: string;
  packageGeometry: string | null;
  containerForm: "bottle" | "jar" | "tube" | "compact" | "other";
  closureOrDispenser: "cap" | "pump" | "dropper" | "spray" | "other" | "none";
  materialOpacity: "transparent" | "translucent" | "opaque" | "mixed";
  liquidVisibility: "visible" | "not_visible" | "not_applicable";
  labelRegions: ProductRegion[];
  logoRegions: ProductRegion[];
};

export type FootwearAttributes = {
  shoeType: string;
  silhouette: string | null;
  upperMaterial: string[];
  outsole: string | null;
  midsole: string | null;
  panelStructure: string[];
  lacing: string | null;
  tongue: string | null;
  heel: string | null;
  logoRegions: ProductRegion[];
  colorBlocking: string[];
};

export type ProductVerticalAttributes =
  | { vertical: "apparel"; details: ApparelAttributes }
  | { vertical: "jewelry"; details: JewelryAttributes }
  | { vertical: "watches"; details: WatchAttributes }
  | { vertical: "cosmetics"; details: CosmeticsAttributes }
  | { vertical: "footwear"; details: FootwearAttributes };
