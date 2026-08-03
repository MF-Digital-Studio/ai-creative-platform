export type InspirationCategory =
  | "all"
  | "fashion"
  | "cosmetics"
  | "jewelry"
  | "productVideo";

export type InspirationSize = "landscape" | "portrait" | "square" | "tall";

export type DashboardInspiration = {
  id: string;
  category: Exclude<InspirationCategory, "all">;
  titleKey: string;
  typeKey: "image" | "video" | "campaignSet";
  altKey: string;
  promptKey: string;
  src: string;
  size: InspirationSize;
  objectPosition?: string;
};

export const inspirationCategories: InspirationCategory[] = [
  "all",
  "fashion",
  "cosmetics",
  "jewelry",
  "productVideo",
];

export const DASHBOARD_DIRECTION_EVENT = "creative-ai:dashboard-direction";

export const dashboardInspiration: DashboardInspiration[] = [
  {
    id: "architectural-fashion",
    category: "fashion",
    titleKey: "items.architecturalFashion",
    typeKey: "campaignSet",
    altKey: "alts.architecturalFashion",
    promptKey: "prompts.architecturalFashion",
    src: "/auth/fashion-dress-campaign.webp",
    size: "landscape",
    objectPosition: "58% 50%",
  },
  {
    id: "quiet-tailoring",
    category: "fashion",
    titleKey: "items.quietTailoring",
    typeKey: "image",
    altKey: "alts.quietTailoring",
    promptKey: "prompts.quietTailoring",
    src: "/features/templates/fashion-template.webp",
    size: "portrait",
    objectPosition: "50% 42%",
  },
  {
    id: "warm-skincare",
    category: "cosmetics",
    titleKey: "items.warmSkincare",
    typeKey: "campaignSet",
    altKey: "alts.warmSkincare",
    promptKey: "prompts.warmSkincare",
    src: "/workspace-demo/cosmetics/campaign.webp",
    size: "landscape",
  },
  {
    id: "texture-study",
    category: "cosmetics",
    titleKey: "items.textureStudy",
    typeKey: "image",
    altKey: "alts.textureStudy",
    promptKey: "prompts.textureStudy",
    src: "/workspace-demo/cosmetics/texture-macro.webp",
    size: "square",
  },
  {
    id: "gold-sculpture",
    category: "jewelry",
    titleKey: "items.goldSculpture",
    typeKey: "image",
    altKey: "alts.goldSculpture",
    promptKey: "prompts.goldSculpture",
    src: "/workspace-demo/jewelry/macro.webp",
    size: "square",
  },
  {
    id: "soft-daylight-jewelry",
    category: "jewelry",
    titleKey: "items.softDaylightJewelry",
    typeKey: "campaignSet",
    altKey: "alts.softDaylightJewelry",
    promptKey: "prompts.softDaylightJewelry",
    src: "/features/templates/jewelry-template.webp",
    size: "portrait",
  },
  {
    id: "midnight-fragrance",
    category: "productVideo",
    titleKey: "items.midnightFragrance",
    typeKey: "video",
    altKey: "alts.midnightFragrance",
    promptKey: "prompts.midnightFragrance",
    src: "/features/image-and-video/video-poster.webp",
    size: "tall",
  },
  {
    id: "jewelry-motion",
    category: "productVideo",
    titleKey: "items.jewelryMotion",
    typeKey: "video",
    altKey: "alts.jewelryMotion",
    promptKey: "prompts.jewelryMotion",
    src: "/workspace-demo/jewelry/video-poster.webp",
    size: "portrait",
  },
];
