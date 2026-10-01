import type { GenerationAttempt } from "./types";

const statusRank = { pass: 3, pass_with_warnings: 2, fail: 1, validation_unavailable: 0 } as const;

function issueCounts(attempt: GenerationAttempt) {
  return {
    critical: attempt.validation.issues.filter(({ severity }) => severity === "critical").length,
    major: attempt.validation.issues.filter(({ severity }) => severity === "major").length,
    minor: attempt.validation.issues.filter(({ severity }) => severity === "minor").length,
  };
}

export function selectFinalAttempt(original: GenerationAttempt, repair: GenerationAttempt | null): GenerationAttempt {
  if (!repair || repair.validation.status === "validation_unavailable") return original;
  if (statusRank[repair.validation.status] > statusRank[original.validation.status]) return repair;
  if (statusRank[repair.validation.status] < statusRank[original.validation.status]) return original;

  const originalCounts = issueCounts(original);
  const repairCounts = issueCounts(repair);
  for (const key of ["critical", "major", "minor"] as const) {
    if (repairCounts[key] < originalCounts[key]) return repair;
    if (repairCounts[key] > originalCounts[key]) return original;
  }
  return original;
}
