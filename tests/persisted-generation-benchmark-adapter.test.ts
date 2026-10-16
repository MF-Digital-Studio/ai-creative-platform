import assert from "node:assert/strict";
import test from "node:test";

import { evaluateGenerationQualityBenchmark } from "../src/lib/generation/benchmark/generation-quality-benchmark";
import { adaptPersistedGenerationForBenchmark } from "../src/lib/generation/benchmark/persisted-generation-benchmark-adapter";

const successfulRecord = {
  status: "succeeded",
  processingDurationMs: 821,
  providerMetadata: {
    validation: { status: "pass", commerciallyUsable: true, issueCodes: [] },
    fidelity_validation: { status: "pass", commerciallyUsable: true, issueCodes: [] },
    qualityGatePassed: true,
    qualityRejected: false,
    validationUnavailable: false,
    verificationStatus: "verified",
    auto_repair: { attempted: false, selectedAttempt: 0 },
    costTelemetry: { totalExternalAICalls: 4 },
    prompt: "must never be exported",
    apiKey: "must never be exported",
    outputUrl: "https://private.example/output.png",
  },
};

test("adapter derives a redacted benchmark observation from complete persisted metadata", () => {
  const adapted = adaptPersistedGenerationForBenchmark({ fixtureId: "watches-on-wrist-multiview-reference", generation: successfulRecord });
  assert.equal(adapted.status, "ready");
  if (adapted.status !== "ready") return;
  assert.deepEqual(adapted.observation.repair, { attempted: false, selectedAttempt: 0 });
  assert.equal(adapted.observation.providerCallCount, 4);
  assert.equal(adapted.observation.latencyMs, 821);
  assert.equal(adapted.observation.cost.estimatedUsd, null);
  assert.equal(adapted.observation.evidenceSource, "unknown");
  assert.equal(JSON.stringify(adapted), JSON.stringify(adapted).replace(/must never be exported|https:\/\/private\.example\/output\.png/g, ""));
  const report = evaluateGenerationQualityBenchmark([adapted.observation]);
  assert.equal(report.results[0]?.commercialSuccess, true);
});

test("adapter preserves rejected and unverified terminal outcomes", () => {
  const rejected = adaptPersistedGenerationForBenchmark({
    fixtureId: "apparel-studio-single",
    generation: { status: "failed", providerMetadata: { validation: { status: "fail", commerciallyUsable: false, issueCodes: ["product_identity_drift"] }, qualityGatePassed: false, qualityRejected: true, verificationStatus: "verified" } },
  });
  const unverified = adaptPersistedGenerationForBenchmark({
    fixtureId: "cosmetics-scenic-multiview-reference",
    generation: { status: "succeeded", providerMetadata: { validation: { status: "validation_unavailable", commerciallyUsable: null, issueCodes: [] }, qualityGatePassed: null, qualityRejected: false, validationUnavailable: true, verificationStatus: "unverified" } },
  });
  assert.equal(rejected.status, "ready");
  assert.equal(unverified.status, "ready");
  if (rejected.status !== "ready" || unverified.status !== "ready") return;
  const report = evaluateGenerationQualityBenchmark([rejected.observation, unverified.observation]);
  assert.equal(report.results[0]?.commercialSuccess, false);
  assert.equal(report.results[0]?.terminalDecision, "rejected");
  assert.equal(report.results[1]?.commercialSuccess, false);
  assert.equal(report.results[1]?.terminalDecision, "succeeded_unverified");
});

test("adapter makes missing metadata explicit and rejects contradictions", () => {
  const incomplete = adaptPersistedGenerationForBenchmark({ fixtureId: "bags-studio-single", generation: { status: "failed" } });
  assert.deepEqual(incomplete, { status: "incomplete", sourceTerminalStatus: "failed", reasons: ["provider_metadata_missing"] });
  assert.throws(() => adaptPersistedGenerationForBenchmark({
    fixtureId: "footwear-studio-single",
    generation: { status: "succeeded", providerMetadata: { validation: { status: "fail", commerciallyUsable: false, issueCodes: [] }, qualityGatePassed: false, qualityRejected: true } },
  }));
  assert.throws(() => adaptPersistedGenerationForBenchmark({
    fixtureId: "jewelry-studio-single",
    generation: { status: "succeeded", providerMetadata: { validation: { status: "pass", commerciallyUsable: true, issueCodes: [] }, fidelity_validation: { status: "fail", commerciallyUsable: false, issueCodes: [] }, qualityGatePassed: true } },
  }));
  assert.throws(() => adaptPersistedGenerationForBenchmark({
    fixtureId: "jewelry-studio-single",
    humanVisualReview: "fabricated" as "pass",
    generation: successfulRecord,
  }));
});
