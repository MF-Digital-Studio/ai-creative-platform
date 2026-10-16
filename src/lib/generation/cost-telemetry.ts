export type CostTelemetryOutcome = "succeeded" | "failed" | "unverified";

export type CostTelemetryInput = {
  productUnderstandingCalls: number;
  referenceAnalysisCalls: number;
  imageGenerationCalls: number;
  validationCalls: number;
  repairGenerationCalls: number;
  promptEnhancementCalls?: number;
  artworkAnalysisCalls?: number;
  segmentationCalls?: number;
  projectionAnalysisCalls?: number;
  // A failure before asset loading cannot truthfully report zero inputs.
  inputProductImageCount: number | null;
  inputReferenceCount: number | null;
  repairAttempted: boolean;
  finalOutcome: CostTelemetryOutcome;
  validationOutcome: string;
  providerUsage?: unknown;
};

export function createCostTelemetry(input: CostTelemetryInput) {
  const promptEnhancementCalls = input.promptEnhancementCalls ?? 0;
  const artworkAnalysisCalls = input.artworkAnalysisCalls ?? 0;
  const segmentationCalls = input.segmentationCalls ?? 0;
  const projectionAnalysisCalls = input.projectionAnalysisCalls ?? 0;
  return {
    version: "generation-cost-v1",
    productUnderstandingCalls: input.productUnderstandingCalls,
    referenceAnalysisCalls: input.referenceAnalysisCalls,
    imageGenerationCalls: input.imageGenerationCalls,
    validationCalls: input.validationCalls,
    repairGenerationCalls: input.repairGenerationCalls,
    promptEnhancementCalls,
    artworkAnalysisCalls,
    segmentationCalls,
    projectionAnalysisCalls,
    totalExternalAICalls: input.productUnderstandingCalls + input.referenceAnalysisCalls + input.imageGenerationCalls + input.validationCalls + input.repairGenerationCalls + promptEnhancementCalls + artworkAnalysisCalls + segmentationCalls + projectionAnalysisCalls,
    inputProductImageCount: input.inputProductImageCount,
    inputReferenceCount: input.inputReferenceCount,
    repairAttempted: input.repairAttempted,
    finalOutcome: input.finalOutcome,
    validationOutcome: input.validationOutcome,
    ...(input.providerUsage === undefined ? {} : { providerUsage: input.providerUsage }),
  };
}
