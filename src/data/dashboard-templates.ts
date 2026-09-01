export type DashboardTemplate = {
  id: string;
  titleKey: string;
  descriptorKey: string;
  typeKey: "image" | "video" | "campaignSet";
  altKey: string;
  src: string;
  objectPosition?: string;
};

export const dashboardTemplates: DashboardTemplate[] = [
  {
    id: "studio-product-shot",
    titleKey: "items.studioProductShot",
    descriptorKey: "descriptors.studioProductShot",
    typeKey: "image",
    altKey: "alts.studioProductShot",
    src: "/features/templates/cosmetics-template.webp",
  },
  {
    id: "editorial-fashion",
    titleKey: "items.editorialFashion",
    descriptorKey: "descriptors.editorialFashion",
    typeKey: "image",
    altKey: "alts.editorialFashion",
    src: "/features/templates/fashion-template.webp",
    objectPosition: "50% 42%",
  },
  {
    id: "luxury-cosmetics",
    titleKey: "items.luxuryCosmetics",
    descriptorKey: "descriptors.luxuryCosmetics",
    typeKey: "campaignSet",
    altKey: "alts.luxuryCosmetics",
    src: "/workspace-demo/cosmetics/campaign.webp",
  },
  {
    id: "jewelry-close-up",
    titleKey: "items.jewelryCloseUp",
    descriptorKey: "descriptors.jewelryCloseUp",
    typeKey: "image",
    altKey: "alts.jewelryCloseUp",
    src: "/workspace-demo/jewelry/macro.webp",
  },
  {
    id: "lifestyle-scene",
    titleKey: "items.lifestyleScene",
    descriptorKey: "descriptors.lifestyleScene",
    typeKey: "campaignSet",
    altKey: "alts.lifestyleScene",
    src: "/auth/fashion-dress-campaign.webp",
    objectPosition: "58% 48%",
  },
  {
    id: "short-product-video",
    titleKey: "items.shortProductVideo",
    descriptorKey: "descriptors.shortProductVideo",
    typeKey: "video",
    altKey: "alts.shortProductVideo",
    src: "/features/image-and-video/video-poster.webp",
  },
];
