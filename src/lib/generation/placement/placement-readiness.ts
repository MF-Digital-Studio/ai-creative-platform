import type { GenerationStrategy } from "../strategy/generation-strategy";

export const placementReadinessIssueCodes = [
  "TARGET_REGION_NOT_VISIBLE", "TARGET_REGION_TOO_SMALL", "TARGET_REGION_OCCLUDED",
  "UNSUITABLE_FINGER_ORIENTATION", "UNSUITABLE_WRIST_ORIENTATION", "UNSUITABLE_FOOT_ORIENTATION",
  "PLACEMENT_SPACE_INSUFFICIENT", "BODY_REGION_OUT_OF_FRAME", "COMPETING_PRODUCT_PRESENT",
  "UNWANTED_JEWELRY_PRESENT", "REFERENCE_COMPOSITION_TOO_RESTRICTIVE", "ANATOMY_IMPLAUSIBLE",
  "READINESS_VALIDATION_UNAVAILABLE",
] as const;
export type PlacementReadinessIssueCode = (typeof placementReadinessIssueCodes)[number];
export type PlacementTargetRegion = "ring_finger" | "wrist" | "foot";
export type PlacementReadinessStatus = "pass" | "fail" | "unavailable";

export type PlacementReadinessResult = {
  status: PlacementReadinessStatus;
  issues: PlacementReadinessIssueCode[];
  retryRecommended: boolean;
  targetRegion: PlacementTargetRegion;
  version: "placement-readiness-v1";
};

const retryableIssues = new Set<PlacementReadinessIssueCode>([
  "TARGET_REGION_NOT_VISIBLE", "TARGET_REGION_TOO_SMALL", "TARGET_REGION_OCCLUDED",
  "UNSUITABLE_FINGER_ORIENTATION", "UNSUITABLE_WRIST_ORIENTATION", "UNSUITABLE_FOOT_ORIENTATION",
  "PLACEMENT_SPACE_INSUFFICIENT", "BODY_REGION_OUT_OF_FRAME", "COMPETING_PRODUCT_PRESENT",
  "UNWANTED_JEWELRY_PRESENT", "REFERENCE_COMPOSITION_TOO_RESTRICTIVE", "ANATOMY_IMPLAUSIBLE",
]);

export function resolvePlacementTargetRegion(strategy: GenerationStrategy): PlacementTargetRegion {
  return strategy === "jewelry_on_model" ? "ring_finger" : strategy === "watch_on_wrist" ? "wrist" : "foot";
}

export function unavailablePlacementReadiness(strategy: GenerationStrategy): PlacementReadinessResult {
  return { status: "unavailable", issues: ["READINESS_VALIDATION_UNAVAILABLE"], retryRecommended: false, targetRegion: resolvePlacementTargetRegion(strategy), version: "placement-readiness-v1" };
}

export function mapPlacementReadinessResponse(raw: unknown, strategy: GenerationStrategy): PlacementReadinessResult {
  const targetRegion = resolvePlacementTargetRegion(strategy);
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { issueCodes?: unknown }).issueCodes)) return unavailablePlacementReadiness(strategy);
  const issues = (raw as { issueCodes: unknown[] }).issueCodes.filter(
    (code): code is PlacementReadinessIssueCode => typeof code === "string" && (placementReadinessIssueCodes as readonly string[]).includes(code),
  );
  if ((raw as { targetRegion?: unknown }).targetRegion !== targetRegion) return unavailablePlacementReadiness(strategy);
  if (!issues.length) return { status: "pass", issues: [], retryRecommended: false, targetRegion, version: "placement-readiness-v1" };
  return {
    status: "fail",
    issues,
    // A provider's boolean is advisory; local readiness policy controls retry.
    retryRecommended: issues.some((issue) => retryableIssues.has(issue)),
    targetRegion,
    version: "placement-readiness-v1",
  };
}

const repairInstructions: Partial<Record<PlacementReadinessIssueCode, string>> = {
  TARGET_REGION_NOT_VISIBLE: "Recompose the hand so the complete ring finger is clearly visible, unobstructed, and large enough for precise product placement.",
  TARGET_REGION_OCCLUDED: "Expose the target ring finger clearly and separate it slightly from adjacent fingers.",
  TARGET_REGION_TOO_SMALL: "Use a tighter hand-focused composition with the target finger large enough for product placement.",
  UNSUITABLE_FINGER_ORIENTATION: "Rotate the hand/finger to show a clear natural ring-placement plane.",
  UNWANTED_JEWELRY_PRESENT: "Remove all jewelry from the target finger and all accessories from the target hand. The ring finger must be completely bare.",
  PLACEMENT_SPACE_INSUFFICIENT: "Create clear unobstructed space around the target finger.",
  REFERENCE_COMPOSITION_TOO_RESTRICTIVE: "Preserve the overall reference mood and camera language but prioritize a usable placement-ready hand pose.",
  UNSUITABLE_WRIST_ORIENTATION: "Rotate the wrist to show a clear natural case and strap placement plane.",
  UNSUITABLE_FOOT_ORIENTATION: "Adjust the foot pose to show a clear natural shoe placement plane and ground contact.",
  BODY_REGION_OUT_OF_FRAME: "Reframe so the entire target placement region is visibly inside the crop.",
  COMPETING_PRODUCT_PRESENT: "Remove the competing product from the target placement region.",
  ANATOMY_IMPLAUSIBLE: "Restore natural, physically plausible body anatomy around the target placement region.",
};

export function buildPlacementReadinessRepairInstructions(issues: readonly PlacementReadinessIssueCode[]): string[] {
  return [...new Set(issues.map((issue) => repairInstructions[issue]).filter((instruction): instruction is string => Boolean(instruction)))];
}
