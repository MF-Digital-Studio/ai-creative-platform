import assert from "node:assert/strict";
import test from "node:test";
import { buildImageEditPrompt, parseImageEditIntent, validateEditFidelity } from "../src/lib/image-edit/edit-intent";
import { orderImageEditImages } from "../src/lib/generation/image-roles";
import { resolveImageEditCompletion } from "../src/components/projects/image-edit-completion";

test("background intent permits a background change and protects product/person/composition", () => {
  const intent = parseImageEditIntent("Arka planı açık gri yap, ürüne dokunma.");
  assert.deepEqual(intent.allowedChanges, ["background"]);
  assert.ok(intent.preservedElements.some((entry) => entry.includes("product")));
  assert.match(buildImageEditPrompt("Arka planı açık gri yap.", intent), /Do not redesign or regenerate the entire scene/);
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
