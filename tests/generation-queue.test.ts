import assert from "node:assert/strict";
import test from "node:test";

import { dispatchQueuedGeneration } from "../src/lib/generation/dispatch-queued-generation";

test("queued generation dispatches once and passes its ID to the processor", async () => {
  const received: string[] = [];
  const oldInfo = console.info;
  const diagnostics: string[] = [];
  console.info = (message?: unknown) => diagnostics.push(String(message));
  let result: boolean;
  try { result = await dispatchQueuedGeneration("generation-1", async (id) => {
    received.push(id);
    return { ok: true };
  }, async () => assert.fail("successful dispatch must not mark failed"));
  } finally { console.info = oldInfo; }
  assert.equal(result, true);
  assert.deepEqual(received, ["generation-1"]);
  assert.equal(diagnostics.filter((message) => message.includes("dispatch_requested")).length, 0);
});

test("failed dispatch marks the queued generation failed", async () => {
  const failed: string[] = [];
  const originalError = console.error;
  console.error = () => {};
  try {
    const result = await dispatchQueuedGeneration("generation-2", async () => ({ ok: false, message: "generationFailed" }), async (id) => { failed.push(id); });
    assert.equal(result, false);
    assert.deepEqual(failed, ["generation-2"]);
  } finally {
    console.error = originalError;
  }
});
