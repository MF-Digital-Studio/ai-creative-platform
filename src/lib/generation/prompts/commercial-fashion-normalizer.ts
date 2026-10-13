/**
 * Keeps benign fashion-reference language professional before it reaches an
 * image provider. This is presentation guidance only; it never alters source
 * product identity, provider safety behavior, or user intent outside these
 * narrow descriptive phrases.
 */
const neutralFashionReplacements: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bbody emphasis\b/gi, "garment fit and silhouette"],
  [/\bbody contour emphasis\b/gi, "garment drape and fit"],
  [/\bexposed skin emphasis\b/gi, "normal fashion styling"],
  [/\b(?:body|skin|torso|chest|hips?|waist|curves?)\s*(?:focused|focus|emphasis)\b/gi, "garment fit and silhouette"],
  [/\bsensual pose\b/gi, "editorial pose"],
  [/\bprovocative pose\b/gi, "editorial pose"],
  [/\bintimate\s+(?=(?:pose|portrait|fashion|styling)\b)/gi, "editorial "],
  [/\brevealing\s+(?=(?:pose|styling|fashion)\b)/gi, "fashion-forward "],
  [/\bsensual\s+(?=(?:fashion|editorial|pose|styling)\b)/gi, "refined "],
];

export const commercialFashionSafetyContext = "Create a non-explicit commercial fashion photograph featuring a clearly adult model. Keep the presentation product-focused, professionally styled, and suitable for mainstream fashion advertising/e-commerce.";

export type CommercialFashionSafetyInput = {
  vertical: string | null | undefined;
  /** Resolved scene semantics, never a preservation strategy label. */
  requiresCommercialFashionSafety: boolean;
};

/** Canonical eligibility gate shared by normal and reference-replacement prompts. */
export function resolveCommercialFashionSafetyLayer(input: CommercialFashionSafetyInput) {
  const applied = input.vertical === "apparel" && input.requiresCommercialFashionSafety;
  return { applied, context: applied ? commercialFashionSafetyContext : "" };
}

export function normalizeCommercialFashionPrompt(value: string): string {
  return neutralFashionReplacements.reduce(
    (normalized, [pattern, replacement]) => normalized.replace(pattern, replacement),
    value,
  );
}

export function applyCommercialFashionSafetyLayer(value: string, input: CommercialFashionSafetyInput) {
  const layer = resolveCommercialFashionSafetyLayer(input);
  return { ...layer, prompt: layer.applied ? normalizeCommercialFashionPrompt(value) : value };
}

/**
 * Final provider boundary. Call only after every deterministic, analyzed, and
 * user-authored prompt fragment has been assembled.
 */
export function finalizeCommercialFashionProviderPrompt(
  assembledPrompt: string,
  input: CommercialFashionSafetyInput,
) {
  return applyCommercialFashionSafetyLayer(assembledPrompt, input);
}
