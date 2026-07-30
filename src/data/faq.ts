export type FaqItem = {
  id: string;
  questionKey: string;
  answerKey: string;
};

export const faqItems = [
  {
    id: "how-it-works",
    questionKey: "items.howItWorks.question",
    answerKey: "items.howItWorks.answer",
  },
  {
    id: "product-fidelity",
    questionKey: "items.productFidelity.question",
    answerKey: "items.productFidelity.answer",
  },
  {
    id: "product-photos",
    questionKey: "items.productPhotos.question",
    answerKey: "items.productPhotos.answer",
  },
  {
    id: "credit-usage",
    questionKey: "items.creditUsage.question",
    answerKey: "items.creditUsage.answer",
  },
  {
    id: "commercial-use",
    questionKey: "items.commercialUse.question",
    answerKey: "items.commercialUse.answer",
  },
  {
    id: "custom-prompts",
    questionKey: "items.customPrompts.question",
    answerKey: "items.customPrompts.answer",
  },
  {
    id: "generation-models",
    questionKey: "items.generationModels.question",
    answerKey: "items.generationModels.answer",
  },
  {
    id: "generation-time",
    questionKey: "items.generationTime.question",
    answerKey: "items.generationTime.answer",
  },
  {
    id: "credit-rollover",
    questionKey: "items.creditRollover.question",
    answerKey: "items.creditRollover.answer",
  },
  {
    id: "subscription",
    questionKey: "items.subscription.question",
    answerKey: "items.subscription.answer",
  },
] as const satisfies readonly FaqItem[];
