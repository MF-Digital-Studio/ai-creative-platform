import type { PlacementReadinessIssueCode } from "./placement-readiness";

const blockingIssues = new Set<PlacementReadinessIssueCode>([
  "ANATOMY_IMPLAUSIBLE", "TARGET_REGION_NOT_VISIBLE", "TARGET_REGION_OCCLUDED",
  "TARGET_REGION_TOO_SMALL", "PLACEMENT_SPACE_INSUFFICIENT",
]);
const recompositionIssues = new Set<PlacementReadinessIssueCode>([
  "TARGET_REGION_NOT_VISIBLE", "TARGET_REGION_TOO_SMALL", "TARGET_REGION_OCCLUDED", "UNSUITABLE_FINGER_ORIENTATION",
]);
const accessoryIssues = new Set<PlacementReadinessIssueCode>(["UNWANTED_JEWELRY_PRESENT", "COMPETING_PRODUCT_PRESENT"]);

export function shouldRunPlacementAccessoryCleanup(issues: readonly PlacementReadinessIssueCode[]): boolean {
  return issues.some((issue) => accessoryIssues.has(issue)) && !issues.some((issue) => blockingIssues.has(issue));
}

export function shouldUsePlacementSafeRecomposition(issues: readonly PlacementReadinessIssueCode[]): boolean {
  return issues.some((issue) => recompositionIssues.has(issue));
}

export function buildPlacementSafeRecompositionPrompt(): string {
  return "Do not preserve the previous hand geometry or exact reference pose. Recompose the hand to prioritize a clearly visible, large, unobstructed fourth finger suitable for precise product placement. Preserve only lighting, environment, and broad visual mood.";
}

export function buildPlacementAccessoryCleanupPrompt(): string {
  return [
    "STAGE A — ACCESSORY CLEANUP ONLY.",
    "Remove all jewelry and accessories from the target hand while preserving the hand, pose, anatomy, skin, camera, lighting, framing, and environment exactly.",
    "Do not change finger count, move the hand, alter the composition, redesign the background, or introduce any product.",
    "This is a removal-only edit for a clean anatomical placement canvas.",
  ].join("\n\n");
}
