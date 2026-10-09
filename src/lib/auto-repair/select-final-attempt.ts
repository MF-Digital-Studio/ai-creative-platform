import type { GenerationAttempt } from "./types";

const identityCodes = new Set(["product_identity_drift", "different_product", "identity_changed", "center_stone_shape_changed", "stone_count_changed", "stone_layout_changed", "setting_changed", "band_geometry_changed", "watch_dial_structure_changed", "changed_dial_layout", "footwear_panel_structure_changed", "package_geometry_changed", "garment_artwork_changed"]);

function priorityVector(attempt: GenerationAttempt): number[] {
  const issues = attempt.validation.issues;
  const count = (predicate: (issue: typeof issues[number]) => boolean) => issues.filter(predicate).length;
  return [
    count((issue) => issue.severity === "critical" && (issue.category === "product_identity" || identityCodes.has(issue.code.toLowerCase()))),
    count((issue) => issue.severity === "major" && (issue.category === "product_identity" || identityCodes.has(issue.code.toLowerCase()))),
    count((issue) => issue.category === "body_interaction"),
    count((issue) => issue.category === "composition_visibility"),
    count((issue) => issue.category === "reference_match"),
    count((issue) => issue.category === "creative_requirement"),
    count((issue) => issue.severity === "critical"),
    count((issue) => issue.severity === "major"),
    count((issue) => issue.severity === "minor"),
  ];
}

export function selectFinalAttempt(original: GenerationAttempt, repair: GenerationAttempt | null): GenerationAttempt {
  if (!repair || repair.validation.status === "validation_unavailable") return original;
  if (original.validation.status === "validation_unavailable") return repair;
  const originalPriorities = priorityVector(original);
  const repairPriorities = priorityVector(repair);
  for (let index = 0; index < originalPriorities.length; index += 1) {
    if (repairPriorities[index]! < originalPriorities[index]!) return repair;
    if (repairPriorities[index]! > originalPriorities[index]!) return original;
  }
  return original;
}

export type FinalCandidateSelectionReason = "initial_passed" | "repair_passed" | "initial_less_bad_but_quality_rejected" | "repair_less_bad_but_quality_rejected" | "validation_unavailable";

export type FinalCandidateSelection = {
  selectedAttempt: 0 | 1;
  reason: FinalCandidateSelectionReason;
  validationStatus: GenerationAttempt["validation"]["status"];
  qualityGatePassed: boolean | null;
  qualityRejected: boolean;
  attempt: GenerationAttempt;
};

export function resolveFinalCandidateSelection(original: GenerationAttempt, repair: GenerationAttempt | null, accepted: (attempt: GenerationAttempt) => boolean = (attempt) => attempt.validation.status === "pass" || attempt.validation.status === "pass_with_warnings"): FinalCandidateSelection {
  let attempt: GenerationAttempt;
  let reason: FinalCandidateSelectionReason;
  if (accepted(original)) {
    attempt = original;
    reason = "initial_passed";
  } else if (repair && accepted(repair)) {
    attempt = repair;
    reason = "repair_passed";
  } else {
    attempt = selectFinalAttempt(original, repair);
    if (attempt.validation.status === "validation_unavailable") reason = "validation_unavailable";
    else reason = attempt.attempt === 0 ? "initial_less_bad_but_quality_rejected" : "repair_less_bad_but_quality_rejected";
  }
  const qualityGatePassed = attempt.validation.status === "validation_unavailable" ? null : accepted(attempt);
  return {
    attempt,
    selectedAttempt: attempt.attempt,
    reason,
    validationStatus: attempt.validation.status,
    qualityGatePassed,
    qualityRejected: attempt.validation.status !== "validation_unavailable" && !qualityGatePassed,
  };
}

export type GenerationTerminalDecision = "succeeded" | "succeeded_unverified" | "rejected";

export function resolveGenerationTerminalDecision(input: {
  validationStatus: GenerationAttempt["validation"]["status"];
  qualityGatePassed: boolean | null;
  commerciallyUsable: boolean | null;
}): GenerationTerminalDecision {
  if (input.validationStatus === "validation_unavailable") return "succeeded_unverified";
  if (input.validationStatus === "fail" || input.qualityGatePassed === false || input.commerciallyUsable === false) return "rejected";
  return "succeeded";
}
