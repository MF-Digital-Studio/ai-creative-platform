import assert from "node:assert/strict";
import { test } from "node:test";
import { APPAREL_PROJECTION_VERSION, resolveProjectionAppliedState, type ProjectionMetadata } from "../src/lib/apparel-projection/types";
import { resolveTargetSurfaceReadiness } from "../src/lib/apparel-projection/resolve-target-readiness";

test("projection metadata distinguishes runtime capability from applied composite", () => {
  const loaded: ProjectionMetadata = { version: APPAREL_PROJECTION_VERSION, enabled: true, applied: false, fallbackReason: "placement_unavailable", artworkExtractionMode: "segmentation", garmentSurfaceConfidence: .8, warpMode: "unavailable", finishingPassApplied: false, validationStatus: "not_applied", repairAttempted: false };
  const applied: ProjectionMetadata = { ...loaded, applied: true, fallbackReason: null, warpMode: "affine" };
  assert.equal(loaded.enabled, true);
  assert.equal(loaded.applied, false);
  assert.equal(applied.applied, true);
  assert.equal(resolveProjectionAppliedState({ enabled: true, compositeSucceeded: false }), false);
  assert.equal(resolveProjectionAppliedState({ enabled: true, compositeSucceeded: true }), true);
});

test("projection target readiness fails early for unavailable or low confidence landmarks", () => {
  assert.deepEqual(resolveTargetSurfaceReadiness({ targetLandmarksAvailable: false, minimumConfidence: .75, confidence: 0 }), { ready: false, fallbackReason: "target_surface_unavailable" });
  assert.deepEqual(resolveTargetSurfaceReadiness({ targetLandmarksAvailable: true, minimumConfidence: .75, confidence: .4 }), { ready: false, fallbackReason: "target_surface_unavailable" });
  assert.deepEqual(resolveTargetSurfaceReadiness({ targetLandmarksAvailable: true, minimumConfidence: .75, confidence: .9 }), { ready: true, fallbackReason: null });
});
