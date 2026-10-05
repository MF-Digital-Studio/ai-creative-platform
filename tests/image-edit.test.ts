import assert from "node:assert/strict";
import test from "node:test";
import { buildImageEditPrompt, parseImageEditIntent, validateEditFidelity } from "../src/lib/image-edit/edit-intent";
import { orderImageEditImages } from "../src/lib/generation/image-roles";
import { resolveImageEditCompletion } from "../src/components/projects/image-edit-completion";
import { failGenerationProgress, finishGenerationProgress, setProgressModalVisibility, startGenerationProgress } from "../src/components/projects/generation-progress-state";

test("background intent permits a background change and protects product/person/composition", () => {
  const intent = parseImageEditIntent("Arka planı açık gri yap, ürüne dokunma.");
  assert.deepEqual(intent.allowedChanges, ["background"]);
  assert.ok(intent.preservedElements.some((entry) => entry.includes("product")));
  assert.match(buildImageEditPrompt("Arka planı açık gri yap.", intent), /Do not redesign or regenerate the entire scene/);
});

test("image edit prompt retains Bags identity lock during a background change", () => {
  const prompt = buildImageEditPrompt("change background", parseImageEditIntent("change background"));
  assert.match(prompt, /For bags, preserve bag type and silhouette.*strap presence\/placement/i);
});

test("lighting intent leaves composition protected", () => {
  const intent = parseImageEditIntent("Işığı daha sıcak yap.");
  assert.ok(intent.allowedChanges.includes("lighting"));
  assert.ok(intent.preservedElements.includes("composition and camera"));
});

test("unrelated scene changes fail scope and product drift fails", () => {
  const overreach = validateEditFidelity({ requestedChangeApplied: true, baseScenePreserved: false, productIdentityPreserved: true, subjectIdentityPreserved: true, posePreserved: true, compositionPreserved: true, unrelatedChanges: true });
  assert.ok(overreach.issueCodes.includes("EDIT_SCOPE_OVERREACH"));
  const productDrift = validateEditFidelity({ requestedChangeApplied: true, baseScenePreserved: true, productIdentityPreserved: false, subjectIdentityPreserved: true, posePreserved: true, compositionPreserved: true, unrelatedChanges: false });
  assert.equal(productDrift.status, "fail");
  assert.ok(productDrift.issueCodes.includes("EDIT_PRODUCT_IDENTITY_DRIFT"));
});

test("edit inputs put the selected base image before the source product", () => {
  const image = (id: string) => ({ id, bucketId: "bucket", objectPath: id, data: Buffer.from(id), mimeType: "image/png" });
  assert.deepEqual(orderImageEditImages(image("selected-base"), image("product")).map(({ role, id }) => [role, id]), [["generated_attempt", "selected-base"], ["product_identity_source", "product"]]);
});

test("successful UI completion closes pending state, selects returned generation, clears instruction and refreshes", () => {
  assert.deepEqual(resolveImageEditCompletion({ ok: true, generationId: "edited-output" }), { pending: false, selectedGenerationId: "edited-output", clearInstruction: true, error: false, refresh: true });
});

test("failed UI completion exits pending while retaining selection and instruction for retry", () => {
  assert.deepEqual(resolveImageEditCompletion({ ok: false }), { pending: false, selectedGenerationId: null, clearInstruction: false, error: true, refresh: false });
});

test("generation progress opens on start, closes without changing work, and reopens at the current stage", () => {
  const started = startGenerationProgress("generation");
  assert.equal(started.modalOpen, true);
  const closed = setProgressModalVisibility({ ...started, status: "validating" }, false);
  assert.equal(closed.modalOpen, false);
  assert.equal(closed.status, "validating");
  const reopened = setProgressModalVisibility(closed, true);
  assert.equal(reopened.modalOpen, true);
  assert.equal(reopened.status, "validating");
});

test("successful generation preserves returned id and failed state remains recoverable", () => {
  const completed = finishGenerationProgress(startGenerationProgress("generation"), "generation-123");
  assert.equal(completed.status, "succeeded");
  assert.equal(completed.generationId, "generation-123");
  assert.equal(completed.modalOpen, false);
  const failed = failGenerationProgress(startGenerationProgress("edit"), "provider error");
  assert.equal(failed.operation, "edit");
  assert.equal(failed.status, "failed");
  assert.equal(failed.error, "provider error");
  assert.equal(setProgressModalVisibility(failed, true).error, "provider error");
});
