import type { RepairPlan } from "./types";

export function compileRepairInstructions(originalPrompt: string, plan: RepairPlan): string {
  if (!plan.shouldRetry) return originalPrompt;
  return [
    originalPrompt,
    "",
    "REPAIR PRIORITY — FIX THESE VALIDATED ISSUES",
    ...(plan.issueCodes.some((code) => code.toLowerCase().startsWith("apparel_artwork_")) ? ["The separate apparel_artwork_identity_source remains available as exact print authority during this repair. Do not improve scene aesthetics at the expense of artwork correctness."] : []),
    ...plan.repairInstructions.map((instruction) => `- ${instruction}`),
    "Preserve all existing ProductProfile, scene suitability, composition, creative compliance, and preservation-mode rules. Change only the failed dimensions.",
  ].join("\n");
}
