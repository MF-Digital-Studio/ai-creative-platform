import type { ReferenceStyleBrief } from "./references/reference-style-brief";

export type HumanReferenceClassification = "commercial_fashion" | "editorial_fashion" | "lifestyle" | "product_reference" | "potentially_sensitive" | "unsupported";
export type KlayReferenceClassification = "adult_editorial_fashion" | "potentially_sensitive" | "unsupported";
export type ReferenceFashionClassification = { humanReferenceClassification: HumanReferenceClassification; klayClassification: KlayReferenceClassification; explicitSexualEvidence: boolean; promptContext: string };

const explicitSexualEvidence = /\b(?:explicit\s+(?:nudity|nude|sexual)|sexual\s+(?:activity|act|intercourse)|intercourse|masturbat(?:e|ion)|genital(?:s|ia)?|porn(?:ographic|ography)?|fetish\s+(?:scene|content))\b/i;
const commercialFashion = /\b(?:commercial|campaign|e-?commerce|product-focused|lookbook)\b/i;
const editorialFashion = /\b(?:editorial|runway|fashion|styling)\b/i;

/** Fashion exposure, posing, nightlife, and flash never constitute sexual evidence on their own. */
export function classifyHumanReferenceFashion(input: { hasReference: boolean; humanDetected: boolean; styleBrief?: ReferenceStyleBrief | null; userDirection?: string }): ReferenceFashionClassification {
  if (!input.hasReference) return { humanReferenceClassification: "unsupported", klayClassification: "unsupported", explicitSexualEvidence: false, promptContext: "" };
  const text = [input.styleBrief?.visualIntent, input.styleBrief?.poseLanguage, input.styleBrief?.realismCharacter, input.userDirection].filter((value): value is string => Boolean(value)).join("\n");
  if (explicitSexualEvidence.test(text)) return { humanReferenceClassification: "potentially_sensitive", klayClassification: "potentially_sensitive", explicitSexualEvidence: true, promptContext: "" };
  if (!input.humanDetected) return { humanReferenceClassification: "product_reference", klayClassification: "adult_editorial_fashion", explicitSexualEvidence: false, promptContext: "" };
  if (commercialFashion.test(text)) return { humanReferenceClassification: "commercial_fashion", klayClassification: "adult_editorial_fashion", explicitSexualEvidence: false, promptContext: "Use mainstream commercial fashion styling and a non-explicit fashion campaign treatment." };
  if (editorialFashion.test(text)) return { humanReferenceClassification: "editorial_fashion", klayClassification: "adult_editorial_fashion", explicitSexualEvidence: false, promptContext: "Use an adult editorial fashion photograph with product-focused editorial photography and a non-explicit fashion campaign treatment." };
  return { humanReferenceClassification: "lifestyle", klayClassification: "adult_editorial_fashion", explicitSexualEvidence: false, promptContext: "Use a non-explicit, product-focused adult lifestyle photograph." };
}

export function isProviderModerationBlocked(error: unknown): boolean {
  const values: unknown[] = [error];
  if (error && typeof error === "object" && "cause" in error) values.push((error as { cause?: unknown }).cause);
  return values.some((value) => value && typeof value === "object" && [(value as { code?: unknown }).code, (value as { type?: unknown }).type, (value as { message?: unknown }).message].some((part) => typeof part === "string" && /moderation(?:_|\s)?blocked|safety_violations|content_policy/i.test(part)));
}
