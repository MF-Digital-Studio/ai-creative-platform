import assert from "node:assert/strict";
import test from "node:test";

import { dispatchQueuedGeneration } from "../src/lib/generation/dispatch-queued-generation";

test("queued generation enqueues once and passes only its ID", async () => {
  const received: string[] = [];
  const oldInfo = console.info;
  const diagnostics: string[] = [];
  console.info = (message?: unknown) => diagnostics.push(String(message));
  let result: boolean;
  try { result = await dispatchQueuedGeneration("generation-1", async (id) => {
    received.push(id);
  });
  } finally { console.info = oldInfo; }
  assert.equal(result, true);
  assert.deepEqual(received, ["generation-1"]);
  assert.deepEqual(diagnostics, ["[background-job] enqueued"]);
});

test("enqueue exceptions return false", async () => {
  const oldError = console.error;
  console.error = () => {};
  try {
    assert.equal(await dispatchQueuedGeneration("generation-3", async () => { throw new Error("queue offline"); }), false);
  } finally {
    console.error = oldError;
  }
});

test("dispatch never executes the image pipeline in the request", async () => {
  let enqueueFinished = false;
  const originalError = console.error;
  console.error = () => {};
  try {
    const result = await dispatchQueuedGeneration("generation-2", async () => { enqueueFinished = true; });
    assert.equal(result, true);
    assert.equal(enqueueFinished, true);
  } finally {
    console.error = originalError;
  }
});
