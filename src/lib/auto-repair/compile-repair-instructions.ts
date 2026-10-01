import type { RepairPlan } from "./types";

export function compileRepairInstructions(originalPrompt: string, plan: RepairPlan): string {
  if (!plan.shouldRetry) return originalPrompt;
  return [
    originalPrompt,
    "",
    "REPAIR PRIORITY — FIX THESE VALIDATED ISSUES",
    ...plan.repairInstructions.map((instruction) => `- ${instruction}`),
    "Preserve all existing ProductProfile, scene suitability, composition, creative compliance, and preservation-mode rules. Change only the failed dimensions.",
  ].join("\n");
}
