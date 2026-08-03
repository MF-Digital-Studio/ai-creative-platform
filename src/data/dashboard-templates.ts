export type DashboardTemplate = {
  id: string;
  titleKey: string;
  typeKey: "image" | "video" | "campaignSet";
  altKey: string;
  src: string;
  objectPosition?: string;
};

export const dashboardTemplates: DashboardTemplate[] = [
  {
    id: "studio-product-shot",
    titleKey: "items.studioProductShot",
    typeKey: "image",
    altKey: "alts.studioProductShot",
    src: "/features/templates/cosmetics-template.webp",
  },
  {
    id: "editorial-fashion",
    titleKey: "items.editorialFashion",
    typeKey: "image",
    altKey: "alts.editorialFashion",
    src: "/features/templates/fashion-template.webp",
    objectPosition: "50% 42%",
  },
  {
    id: "luxury-cosmetics",
    titleKey: "items.luxuryCosmetics",
    typeKey: "campaignSet",
    altKey: "alts.luxuryCosmetics",
    src: "/workspace-demo/cosmetics/campaign.webp",
  },
  {
    id: "jewelry-close-up",
    titleKey: "items.jewelryCloseUp",
    typeKey: "image",
    altKey: "alts.jewelryCloseUp",
    src: "/workspace-demo/jewelry/macro.webp",
  },
  {
    id: "lifestyle-scene",
    titleKey: "items.lifestyleScene",
    typeKey: "campaignSet",
    altKey: "alts.lifestyleScene",
    src: "/auth/fashion-dress-campaign.webp",
    objectPosition: "58% 48%",
  },
  {
    id: "short-product-video",
    titleKey: "items.shortProductVideo",
    typeKey: "video",
    altKey: "alts.shortProductVideo",
    src: "/features/image-and-video/video-poster.webp",
  },
];
