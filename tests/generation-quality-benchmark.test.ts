import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateGenerationQualityBenchmark,
  formatGenerationQualityBenchmarkSummary,
  generationQualityBenchmarkFixtures,
} from "../src/lib/generation/benchmark/generation-quality-benchmark";

const observation = {
  fixtureId: "watches-on-wrist-multiview-reference",
  validation: { status: "pass" as const, commerciallyUsable: true, issues: [] },
  qualityGatePassed: true,
  repair: { attempted: false, selectedAttempt: 0 as const },
  providerCallCount: 3,
  latencyMs: 842,
  cost: { estimatedUsd: 0.041, usageComplete: true, pricingComplete: true },
  humanVisualReview: "not_reviewed" as const,
};

test("benchmark fixtures cover every supported vertical with single and multi-view scenarios", () => {
  assert.equal(generationQualityBenchmarkFixtures.length, 14);
  for (const vertical of ["apparel", "jewelry", "watches", "footwear", "bags", "cosmetics"]) {
    const scenarios = generationQualityBenchmarkFixtures.filter((fixture) => fixture.vertical === vertical);
    assert.ok(scenarios.some((fixture) => fixture.inputRoles.length === 1), `${vertical} single-view`);
    assert.ok(scenarios.some((fixture) => fixture.inputRoles.includes("supporting_product")), `${vertical} multi-view`);
  }
});

test("benchmark records verified technical success without inventing a human quality score", () => {
  const report = evaluateGenerationQualityBenchmark([observation]);
  assert.equal(report.results[0]?.commercialSuccess, true);
  assert.equal(report.results[0]?.terminalDecision, "succeeded");
  assert.equal(report.results[0]?.estimatedCostUsd, 0.041);
  assert.equal(report.summary.humanReviewsRecorded, 0);
  assert.match(formatGenerationQualityBenchmarkSummary(report), /1\/14 scenarios evaluated/);
});

test("watch benchmarks separate wearability findings from watch identity findings", () => {
  const report = evaluateGenerationQualityBenchmark([{
    ...observation,
    fixtureId: "watches-on-wrist-commercial-rejection",
    validation: { status: "fail", commerciallyUsable: false, issues: [{ code: "watch_lug_strap_geometry_impossible", category: "body_interaction", severity: "critical", identityImpact: "none" }] },
    qualityGatePassed: false,
  }]);
  assert.equal(report.results[0]?.watchWearabilityFindings[0]?.code, "watch_lug_strap_geometry_impossible");
  assert.equal(report.results[0]?.productIdentityFindings.length, 0);
  assert.equal(report.results[0]?.commercialSuccess, false);
});

test("watch benchmarks separately expose contact, bracelet articulation, and dial-detail findings", () => {
  const report = evaluateGenerationQualityBenchmark([{
    ...observation,
    fixtureId: "watches-on-wrist-close-crop",
    validation: { status: "fail", commerciallyUsable: false, issues: [
      { code: "contact_shadow_too_weak", category: "body_interaction", severity: "critical", identityImpact: "none" },
      { code: "bracelet_case_transition_inconsistent", category: "body_interaction", severity: "critical", identityImpact: "none" },
      { code: "dial_detail_fidelity_loss", category: "product_identity", severity: "major", identityImpact: "major" },
    ] },
    qualityGatePassed: false,
  }]);
  const result = report.results[0];
  assert.equal(result?.watchContactRealismFindings[0]?.code, "contact_shadow_too_weak");
  assert.equal(result?.watchBraceletArticulationFindings[0]?.code, "bracelet_case_transition_inconsistent");
  assert.equal(result?.watchDialDetailFidelityFindings[0]?.code, "dial_detail_fidelity_loss");
  assert.equal(result?.productIdentityFindings[0]?.code, "dial_detail_fidelity_loss");
});

test("rejected and unverified results cannot be reported as commercial successes", () => {
  const report = evaluateGenerationQualityBenchmark([
    { ...observation, validation: { status: "fail", commerciallyUsable: false, issues: [{ code: "watch_dial_structure_changed", category: "product_identity", severity: "critical", identityImpact: "critical" }] }, qualityGatePassed: false, repair: { attempted: true, selectedAttempt: 1 } },
    { ...observation, fixtureId: "apparel-studio-single", validation: { status: "validation_unavailable", commerciallyUsable: null, issues: [] }, qualityGatePassed: null, providerCallCount: null, latencyMs: null, cost: { estimatedUsd: 0.02, usageComplete: false, pricingComplete: true } },
  ]);
  assert.equal(report.results[0]?.terminalDecision, "rejected");
  assert.equal(report.results[0]?.commercialSuccess, false);
  assert.equal(report.results[0]?.productIdentityFindings.length, 1);
  assert.equal(report.results[1]?.terminalDecision, "succeeded_unverified");
  assert.equal(report.results[1]?.commercialSuccess, false);
  assert.equal(report.results[1]?.costMeasurementStatus, "incomplete");
  assert.equal(report.results[1]?.estimatedCostUsd, null);
});

test("benchmark rejects unknown or duplicated fixture observations", () => {
  assert.throws(() => evaluateGenerationQualityBenchmark([{ ...observation, fixtureId: "missing" }]));
  assert.throws(() => evaluateGenerationQualityBenchmark([observation, observation]));
});
