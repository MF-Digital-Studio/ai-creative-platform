import type { AppLocale } from "@/i18n/routing";

export type PricingPlanId = "starter" | "creator" | "studio";

export type PricingPlan = {
  id: PricingPlanId;
  nameKey: string;
  descriptionKey: string;
  price: Record<AppLocale, string>;
  billingPeriodKey: string;
  creditsKey: string;
  featureKeys: readonly string[];
  ctaKey: string;
  href: `/signup?plan=${PricingPlanId}`;
  highlighted?: boolean;
  badgeKey?: string;
};

export const pricingPlans = [
  {
    id: "starter",
    nameKey: "plans.starter.name",
    descriptionKey: "plans.starter.description",
    price: {
      tr: "₺749",
      en: "$19",
    },
    billingPeriodKey: "billingPeriod",
    creditsKey: "plans.starter.credits",
    featureKeys: [
      "plans.starter.features.monthlyCredits",
      "plans.starter.features.imageGeneration",
      "plans.starter.features.templates",
      "plans.starter.features.videoPreviews",
      "plans.starter.features.queue",
      "plans.starter.features.commercialUse",
      "plans.starter.features.history",
    ],
    ctaKey: "plans.starter.cta",
    href: "/signup?plan=starter",
  },
  {
    id: "creator",
    nameKey: "plans.creator.name",
    descriptionKey: "plans.creator.description",
    price: {
      tr: "₺1.999",
      en: "$49",
    },
    billingPeriodKey: "billingPeriod",
    creditsKey: "plans.creator.credits",
    featureKeys: [
      "plans.creator.features.included",
      "plans.creator.features.monthlyCredits",
      "plans.creator.features.imageModels",
      "plans.creator.features.imageToVideo",
      "plans.creator.features.videoQuality",
      "plans.creator.features.batchVariations",
      "plans.creator.features.productDetail",
      "plans.creator.features.queue",
      "plans.creator.features.history",
    ],
    ctaKey: "plans.creator.cta",
    href: "/signup?plan=creator",
    highlighted: true,
    badgeKey: "mostPopular",
  },
  {
    id: "studio",
    nameKey: "plans.studio.name",
    descriptionKey: "plans.studio.description",
    price: {
      tr: "₺3.999",
      en: "$99",
    },
    billingPeriodKey: "billingPeriod",
    creditsKey: "plans.studio.credits",
    featureKeys: [
      "plans.studio.features.included",
      "plans.studio.features.monthlyCredits",
      "plans.studio.features.models",
      "plans.studio.features.batchCampaigns",
      "plans.studio.features.team",
      "plans.studio.features.brandAssets",
      "plans.studio.features.queue",
      "plans.studio.features.history",
      "plans.studio.features.support",
    ],
    ctaKey: "plans.studio.cta",
    href: "/signup?plan=studio",
  },
] as const satisfies readonly PricingPlan[];
