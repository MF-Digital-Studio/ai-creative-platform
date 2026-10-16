# Generation quality benchmark foundation

This is an offline benchmark contract, not a provider runner. It makes technical generation evidence comparable without fabricating image-quality scores or sending billable requests.

## Coverage

`generationQualityBenchmarkFixtures` defines two supported scenarios for each production vertical: a single-source studio/product scenario and a multi-view scenario. The multi-view scenario uses a primary product, a supporting view, and a reference scene. Human interaction is required only for existing on-model/on-body/on-foot/on-wrist/carry preset families; cosmetics lifestyle remains product-led.

Each result records validator status and identity findings, commercial usability, final quality-gate decision, repair selection, provider-call count, latency, and a cost only when both usage and pricing are complete. `humanVisualReview` is deliberately separate from automatic validation and starts as `not_reviewed`.

## Offline command

Run the following command to emit a machine-readable empty baseline. It performs no external calls and explicitly reports zero evaluated scenarios:

```bash
npx tsx scripts/run-generation-quality-benchmark.ts
```

The output has `providerCallsPerformedByHarness: false`, the fixture manifest, an empty `results` array, and a concise `humanReadableSummary`. This field describes the harness only; each future result retains its historical `providerCallCount`.

## Recording a future real-image run

1. Generate the selected fixture images through the normal product flow; do not change models, prompts, or quality settings for the benchmark.
2. Extract redacted persisted metadata into a JSON array of `BenchmarkObservation` objects: validation status/findings, quality gate, repair selection, external-call count, latency, and cost completeness.
3. Run `npm run benchmark:generation-quality -- path/to/redacted-observations.json` to serialize the report. Keep `estimatedUsd` null unless provider usage and model pricing are both complete.
4. Add an independent reviewer decision (`pass`, `warning`, or `fail`) only after inspecting the actual output and source images. It is not inferred by this harness.
5. Store the serialized report with source-image access controls. A rejected or `succeeded_unverified` result is never counted as a commercial success.

The existing `docs/preset-live-qa-manifest.json`, fidelity tests, quality gate, and cost telemetry remain the source of technical behavior; this harness aggregates their persisted outcomes rather than replacing them.
