export const supportedVerticals = [
  "apparel",
  "jewelry",
  "watches",
  "cosmetics",
  "footwear",
  "bags",
] as const;

export type SupportedVertical = (typeof supportedVerticals)[number];

export const supportedVerticalConfig: Record<
  SupportedVertical,
  { labelKey: string; descriptionKey: string }
> = {
  apparel: { labelKey: "apparel", descriptionKey: "apparelDescription" },
  jewelry: { labelKey: "jewelry", descriptionKey: "jewelryDescription" },
  watches: { labelKey: "watches", descriptionKey: "watchesDescription" },
  cosmetics: { labelKey: "cosmetics", descriptionKey: "cosmeticsDescription" },
  footwear: { labelKey: "footwear", descriptionKey: "footwearDescription" },
  bags: { labelKey: "bags", descriptionKey: "bagsDescription" },
};

export function isSupportedVertical(value: unknown): value is SupportedVertical {
  return typeof value === "string" && supportedVerticals.includes(value as SupportedVertical);
}
