import { resolveGenerationTerminalDecision, type GenerationTerminalDecision } from "@/lib/auto-repair/select-final-attempt";
import type { FidelityValidationIssue, FidelityValidationStatus } from "@/lib/fidelity-validation/types";
import type { SupportedVertical } from "@/lib/verticals/supported-verticals";

export type BenchmarkInputRole = "primary_product" | "supporting_product" | "reference_scene";
export type HumanVisualReview = "not_reviewed" | "pass" | "warning" | "fail";
export type CostMeasurementStatus = "complete" | "incomplete" | "unavailable";
export type SourceGenerationTerminalStatus = "queued" | "processing" | "succeeded" | "failed";
export type BenchmarkEvidenceSource = "synthetic" | "persisted_production" | "unknown";
export type WatchOrientationScenario = "left_outer" | "left_inner" | "right_outer" | "right_inner";

export type GenerationQualityBenchmarkFixture = {
  id: string;
  vertical: SupportedVertical;
  presetFamily: string;
  inputRoles: readonly BenchmarkInputRole[];
  humanInteractionExpected: boolean;
  referenceCompositionExpected: boolean;
  watchWearabilityExpected?: boolean;
  watchContactRealismExpected?: boolean;
  watchBraceletArticulationExpected?: boolean;
  watchDialDetailFidelityExpected?: boolean;
  watchOrientationScenario?: WatchOrientationScenario;
  description: string;
};

// These are scenario contracts, not generated images or quality claims.
export const generationQualityBenchmarkFixtures: readonly GenerationQualityBenchmarkFixture[] = [
  { id: "apparel-studio-single", vertical: "apparel", presetFamily: "apparel-studio", inputRoles: ["primary_product"], humanInteractionExpected: false, referenceCompositionExpected: false, description: "Single-view product-led apparel studio." },
  { id: "apparel-street-multiview-reference", vertical: "apparel", presetFamily: "apparel-street", inputRoles: ["primary_product", "supporting_product", "reference_scene"], humanInteractionExpected: true, referenceCompositionExpected: true, description: "Multi-view apparel worn in a reference-guided street composition." },
  { id: "jewelry-studio-single", vertical: "jewelry", presetFamily: "jewelry-studio", inputRoles: ["primary_product"], humanInteractionExpected: false, referenceCompositionExpected: false, description: "Single-view jewelry detail studio." },
  { id: "jewelry-on-model-multiview-reference", vertical: "jewelry", presetFamily: "jewelry-on-model", inputRoles: ["primary_product", "supporting_product", "reference_scene"], humanInteractionExpected: true, referenceCompositionExpected: true, description: "Multi-view jewelry with subtype-appropriate body contact." },
  { id: "watches-product-single", vertical: "watches", presetFamily: "watches-product-composition", inputRoles: ["primary_product"], humanInteractionExpected: false, referenceCompositionExpected: false, description: "Single-view watch product composition." },
  { id: "watches-on-wrist-close-crop", vertical: "watches", presetFamily: "watches-on-wrist", inputRoles: ["primary_product"], humanInteractionExpected: true, referenceCompositionExpected: false, watchWearabilityExpected: true, watchContactRealismExpected: true, watchBraceletArticulationExpected: true, watchDialDetailFidelityExpected: true, description: "Close wrist crop that isolates case rotation, first-link articulation, skin seating, contact shadow, and dial detail." },
  { id: "watches-on-wrist-multiview-reference", vertical: "watches", presetFamily: "watches-on-wrist", inputRoles: ["primary_product", "supporting_product", "reference_scene"], humanInteractionExpected: true, referenceCompositionExpected: true, watchWearabilityExpected: true, watchContactRealismExpected: true, watchBraceletArticulationExpected: true, watchDialDetailFidelityExpected: true, description: "Multi-view watch with reference-guided wrist anatomy, bracelet articulation, contact realism, and identity." },
  { id: "watches-on-wrist-commercial-rejection", vertical: "watches", presetFamily: "watches-on-wrist", inputRoles: ["primary_product", "reference_scene"], humanInteractionExpected: true, referenceCompositionExpected: true, watchWearabilityExpected: true, watchContactRealismExpected: true, watchBraceletArticulationExpected: true, watchDialDetailFidelityExpected: true, description: "On-wrist placement rejection control for commercially unusable fit, bracelet transition, or physical integration." },
  { id: "watches-on-wrist-left-outer-orientation", vertical: "watches", presetFamily: "watches-on-wrist", inputRoles: ["primary_product", "reference_scene"], humanInteractionExpected: true, referenceCompositionExpected: true, watchWearabilityExpected: true, watchOrientationScenario: "left_outer", description: "Left outer-wrist view: 12 follows the forearm and 6 follows the hand, independent of image-top." },
  { id: "watches-on-wrist-left-inner-orientation", vertical: "watches", presetFamily: "watches-on-wrist", inputRoles: ["primary_product", "reference_scene"], humanInteractionExpected: true, referenceCompositionExpected: true, watchWearabilityExpected: true, watchOrientationScenario: "left_inner", description: "Left inner-wrist view: surface visibility changes but dial and crown are not mirrored." },
  { id: "watches-on-wrist-right-outer-orientation", vertical: "watches", presetFamily: "watches-on-wrist", inputRoles: ["primary_product", "reference_scene"], humanInteractionExpected: true, referenceCompositionExpected: true, watchWearabilityExpected: true, watchOrientationScenario: "right_outer", description: "Right outer-wrist view: 12 follows the forearm and source crown side remains dial-relative." },
  { id: "watches-on-wrist-right-inner-orientation", vertical: "watches", presetFamily: "watches-on-wrist", inputRoles: ["primary_product", "reference_scene"], humanInteractionExpected: true, referenceCompositionExpected: true, watchWearabilityExpected: true, watchOrientationScenario: "right_inner", description: "Right inner-wrist view: case rotation follows the visible wrist surface without reversing the dial." },
  { id: "footwear-studio-single", vertical: "footwear", presetFamily: "footwear-studio", inputRoles: ["primary_product"], humanInteractionExpected: false, referenceCompositionExpected: false, description: "Single-view footwear studio." },
  { id: "footwear-street-multiview-reference", vertical: "footwear", presetFamily: "footwear-street", inputRoles: ["primary_product", "supporting_product", "reference_scene"], humanInteractionExpected: true, referenceCompositionExpected: true, description: "Multi-view footwear on-foot reference composition." },
  { id: "bags-studio-single", vertical: "bags", presetFamily: "bags-studio", inputRoles: ["primary_product"], humanInteractionExpected: false, referenceCompositionExpected: false, description: "Single-view bag studio." },
  { id: "bags-on-model-multiview-reference", vertical: "bags", presetFamily: "bags-on-model", inputRoles: ["primary_product", "supporting_product", "reference_scene"], humanInteractionExpected: true, referenceCompositionExpected: true, description: "Multi-view bag carry with physical interaction checks." },
  { id: "cosmetics-studio-single", vertical: "cosmetics", presetFamily: "cosmetics-studio", inputRoles: ["primary_product"], humanInteractionExpected: false, referenceCompositionExpected: false, description: "Single-view cosmetics packaging studio." },
  { id: "cosmetics-scenic-multiview-reference", vertical: "cosmetics", presetFamily: "cosmetics-scenic", inputRoles: ["primary_product", "supporting_product", "reference_scene"], humanInteractionExpected: false, referenceCompositionExpected: true, description: "Multi-view cosmetics lifestyle scene where packaging remains authoritative." },
] as const;

export type BenchmarkObservation = {
  fixtureId: string;
  validation: {
    status: FidelityValidationStatus;
    commerciallyUsable: boolean | null;
    issues: readonly Pick<FidelityValidationIssue, "code" | "category" | "severity" | "identityImpact">[];
    // Persisted metadata often retains codes but not each finding's full classification.
    unclassifiedIssueCodes?: readonly string[];
  };
  qualityGatePassed: boolean | null;
  repair: { attempted: boolean | null; selectedAttempt: 0 | 1 | null };
  providerCallCount: number | null;
  latencyMs: number | null;
  cost: { estimatedUsd: number | null; usageComplete: boolean; pricingComplete: boolean };
  humanVisualReview: HumanVisualReview;
  evidenceSource?: BenchmarkEvidenceSource;
  sourceTerminalStatus?: SourceGenerationTerminalStatus;
};

export type BenchmarkResult = BenchmarkObservation & {
  vertical: SupportedVertical;
  terminalDecision: GenerationTerminalDecision;
  commercialSuccess: boolean;
  costMeasurementStatus: CostMeasurementStatus;
  estimatedCostUsd: number | null;
  productIdentityFindings: readonly BenchmarkObservation["validation"]["issues"][number][];
  watchWearabilityFindings: readonly BenchmarkObservation["validation"]["issues"][number][];
  watchContactRealismFindings: readonly BenchmarkObservation["validation"]["issues"][number][];
  watchBraceletArticulationFindings: readonly BenchmarkObservation["validation"]["issues"][number][];
  watchDialDetailFidelityFindings: readonly BenchmarkObservation["validation"]["issues"][number][];
  watchOrientationFindings: readonly BenchmarkObservation["validation"]["issues"][number][];
};

export type GenerationQualityBenchmarkReport = {
  version: "generation-quality-benchmark-v1";
  providerCallsPerformedByHarness: false;
  fixtures: readonly GenerationQualityBenchmarkFixture[];
  results: readonly BenchmarkResult[];
  summary: {
    configuredScenarios: number;
    evaluatedScenarios: number;
    commercialSuccesses: number;
    rejected: number;
    unverified: number;
    incompleteMeasurements: number;
    humanReviewsRecorded: number;
  };
};

const watchWearabilityCodes = new Set([
  "watch_case_rotation_mismatch", "watch_wrist_axis_mismatch", "watch_dial_orientation_mismatch", "watch_flat_overlay_appearance", "watch_flat_product_appearance", "watch_strap_not_wrapped", "watch_bracelet_wrap_error", "watch_lug_strap_geometry_impossible", "watch_case_floating", "watch_contact_failure", "watch_contact_shadow_missing", "watch_unwearable_fit", "watch_case_depth_missing", "watch_side_geometry_missing", "watch_perspective_mismatch", "watch_scale_to_wrist_error",
]);
const watchContactRealismCodes = new Set(["watch_case_floating", "watch_contact_failure", "watch_contact_shadow_missing", "contact_shadow_too_weak", "case_skin_seating_unconvincing"]);
const watchBraceletArticulationCodes = new Set(["watch_strap_not_wrapped", "watch_bracelet_wrap_error", "watch_lug_strap_geometry_impossible", "bracelet_case_transition_inconsistent", "bracelet_segment_floating"]);
const watchDialDetailFidelityCodes = new Set(["watch_dial_structure_changed", "changed_dial_layout", "dial_detail_fidelity_loss"]);
const watchOrientationCodes = new Set(["watch_dial_orientation_mismatch", "watch_wrist_side_orientation_mismatch", "watch_crown_side_inconsistency", "watch_case_pose_orientation_mismatch", "watch_case_rotation_mismatch", "watch_wrist_axis_mismatch"]);

function costMeasurementStatus(cost: BenchmarkObservation["cost"]): CostMeasurementStatus {
  if (cost.estimatedUsd !== null && cost.usageComplete && cost.pricingComplete) return "complete";
  if (cost.estimatedUsd !== null || cost.usageComplete || cost.pricingComplete) return "incomplete";
  return "unavailable";
}

export function evaluateGenerationQualityBenchmark(
  observations: readonly BenchmarkObservation[],
  fixtures: readonly GenerationQualityBenchmarkFixture[] = generationQualityBenchmarkFixtures,
): GenerationQualityBenchmarkReport {
  const fixturesById = new Map(fixtures.map((fixture) => [fixture.id, fixture]));
  const observedFixtureIds = new Set<string>();
  const results = observations.map((observation) => {
    const fixture = fixturesById.get(observation.fixtureId);
    if (!fixture) throw new Error(`Unknown generation-quality benchmark fixture: ${observation.fixtureId}`);
    if (observedFixtureIds.has(observation.fixtureId)) throw new Error(`Duplicate generation-quality benchmark observation: ${observation.fixtureId}`);
    observedFixtureIds.add(observation.fixtureId);
    const terminalDecision = resolveGenerationTerminalDecision({
      validationStatus: observation.validation.status,
      qualityGatePassed: observation.qualityGatePassed,
      commerciallyUsable: observation.validation.commerciallyUsable,
    });
    const measurementStatus = costMeasurementStatus(observation.cost);
    return {
      ...observation,
      vertical: fixture.vertical,
      terminalDecision,
      commercialSuccess: terminalDecision === "succeeded" && observation.qualityGatePassed === true && observation.validation.commerciallyUsable === true,
      costMeasurementStatus: measurementStatus,
      estimatedCostUsd: measurementStatus === "complete" ? observation.cost.estimatedUsd : null,
      productIdentityFindings: observation.validation.issues.filter((issue) => issue.category === "product_identity" || issue.identityImpact === "critical" || issue.identityImpact === "major"),
      watchWearabilityFindings: observation.validation.issues.filter((issue) => watchWearabilityCodes.has(issue.code.toLowerCase())),
      watchContactRealismFindings: observation.validation.issues.filter((issue) => watchContactRealismCodes.has(issue.code.toLowerCase())),
      watchBraceletArticulationFindings: observation.validation.issues.filter((issue) => watchBraceletArticulationCodes.has(issue.code.toLowerCase())),
      watchDialDetailFidelityFindings: observation.validation.issues.filter((issue) => watchDialDetailFidelityCodes.has(issue.code.toLowerCase())),
      watchOrientationFindings: observation.validation.issues.filter((issue) => watchOrientationCodes.has(issue.code.toLowerCase())),
    };
  });
  return {
    version: "generation-quality-benchmark-v1",
    providerCallsPerformedByHarness: false,
    fixtures,
    results,
    summary: {
      configuredScenarios: fixtures.length,
      evaluatedScenarios: results.length,
      commercialSuccesses: results.filter(({ commercialSuccess }) => commercialSuccess).length,
      rejected: results.filter(({ terminalDecision }) => terminalDecision === "rejected").length,
      unverified: results.filter(({ terminalDecision }) => terminalDecision === "succeeded_unverified").length,
      incompleteMeasurements: results.filter(({ costMeasurementStatus, latencyMs, providerCallCount }) => costMeasurementStatus !== "complete" || latencyMs === null || providerCallCount === null).length,
      humanReviewsRecorded: results.filter(({ humanVisualReview }) => humanVisualReview !== "not_reviewed").length,
    },
  };
}

export function formatGenerationQualityBenchmarkSummary(report: GenerationQualityBenchmarkReport): string {
  const { summary } = report;
  return `Generation quality benchmark: ${summary.evaluatedScenarios}/${summary.configuredScenarios} scenarios evaluated; ${summary.commercialSuccesses} commercially successful; ${summary.rejected} rejected; ${summary.unverified} unverified; ${summary.humanReviewsRecorded} human visual reviews recorded; ${summary.incompleteMeasurements} incomplete technical measurements.`;
}
