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

## Persisted metadata adapter and pilot workflow

`adaptPersistedGenerationForBenchmark` accepts only an explicitly supplied, redacted record. It does not connect to Supabase, enumerate records, export image URLs, return prompts, or expose provider diagnostics. It derives:

- terminal database status, validation status, commercial usability, and quality-gate state;
- selected repair attempt when `auto_repair` exists;
- external-call count from `costTelemetry.totalExternalAICalls` and latency from `processing_duration_ms`.

The adapter marks records incomplete when terminal, validation, or quality-gate metadata is absent. It rejects contradictions such as a database-success record with a rejected quality gate. Persisted validation codes are retained only as safe codes: existing metadata does not reliably persist each code's category, severity, or identity impact, so those classifications are not invented. A persisted aggregate cost is also kept unavailable because it does not prove complete provider usage and model pricing.

Run the adapter over a manually prepared redacted JSON array:

```bash
npm run benchmark:adapt-persisted -- path/to/redacted-generations.json
```

The output contains the benchmark report plus explicit `adapterResults` for incomplete records. It contains no raw source record, prompt, user/project data, private storage location, API key, or provider error text.

An offline synthetic pilot is included for adapter verification only; every record is marked `evidenceSource: "synthetic"` and is not production or visual-quality evidence:

```bash
npm run benchmark:adapt-persisted -- tests/fixtures/persisted-generation-benchmark-pilot.json
```

## Human visual review rubric

Review the source product images and generated image side-by-side at full composition and close crop. Record `pass`, `warning`, or `fail` independently of automated validation for each of these dimensions:

1. Exact product identity: color, material, construction, physical details, and multi-view consistency.
2. Brand details: logo, label, visible text, artwork, print placement, and typography.
3. Geometry: proportions, silhouettes, panel layout, stone count/settings, dial/sole/package structure as applicable.
4. Physical realism: lighting, shadows, gravity, contact, reflections, and object support.
5. Human realism where expected: anatomy, skin, pose, and credible product interaction.
6. Composition: selected preset, product visibility, reference-scene authority, and no reference-product substitution.
7. Commercial usability: whether the result is suitable for the intended campaign use.

For the first 12 real scenarios, use the normal Klay UI to create one output for every listed fixture, retain the source and generated images in access-controlled review storage, manually prepare redacted metadata with `evidenceSource: "persisted_production"`, run the adapter, and have an independent reviewer enter the human decision. Synthetic test records validate the workflow only; they are not visual evidence or production benchmark results.
