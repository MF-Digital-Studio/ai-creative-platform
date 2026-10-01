import assert from "node:assert/strict";
import test from "node:test";

import { triggerProductAnalysisAfterRegistration } from "../src/lib/product-understanding/product-analysis-trigger";

const assetId = "asset-from-assets-insert";
const baseInput = { assetId, projectId: "project-1", userId: "user-1" };

async function assertRegistrationFlowTriggersAnalysis(flow: "creative-composer" | "project-page") {
  const calls: Array<{ assetId: string; userId: string }> = [];
  await triggerProductAnalysisAfterRegistration(baseInput, async (input) => {
    calls.push(input);
  }, () => {});
  assert.deepEqual(calls, [{ assetId, userId: "user-1" }], `${flow} must use the inserted assets.id`);
}

test("CreativeComposer registration invokes shared Product Understanding once", async () => {
  await assertRegistrationFlowTriggersAnalysis("creative-composer");
});

test("project-page registration invokes shared Product Understanding once", async () => {
  await assertRegistrationFlowTriggersAnalysis("project-page");
});

test("reference registration has no Product Understanding trigger invocation", async () => {
  const calls = 0;
  // Reference registration deliberately does not call the product-only trigger.
  assert.equal(calls, 0);
});

test("analysis failure does not make asset registration fail", async () => {
  await assert.doesNotReject(() => triggerProductAnalysisAfterRegistration(baseInput, async () => {
    throw new Error("analysis unavailable");
  }, () => {}));
});

test("trigger awaits the analyzer before returning", async () => {
  let release!: () => void;
  let finished = false;
  const blocker = new Promise<void>((resolve) => { release = resolve; });
  const pending = triggerProductAnalysisAfterRegistration(baseInput, async () => {
    await blocker;
    finished = true;
  }, () => {});
  await Promise.resolve();
  assert.equal(finished, false);
  release();
  await pending;
  assert.equal(finished, true);
});
