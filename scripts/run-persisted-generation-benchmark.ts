import { readFile } from "node:fs/promises";

import { evaluateGenerationQualityBenchmark, formatGenerationQualityBenchmarkSummary } from "../src/lib/generation/benchmark/generation-quality-benchmark";
import { adaptPersistedGenerationForBenchmark, type PersistedGenerationBenchmarkInput } from "../src/lib/generation/benchmark/persisted-generation-benchmark-adapter";

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) throw new Error("Pass a JSON array of redacted persisted generation records.");
  const parsed: unknown = JSON.parse(await readFile(inputPath, "utf8"));
  if (!Array.isArray(parsed)) throw new Error("Persisted benchmark input must be a JSON array.");
  const adapted = (parsed as PersistedGenerationBenchmarkInput[]).map(adaptPersistedGenerationForBenchmark);
  const observations = adapted.flatMap((result) => result.status === "ready" ? [result.observation] : []);
  const report = evaluateGenerationQualityBenchmark(observations);
  console.log(JSON.stringify({ ...report, adapterResults: adapted.filter((result) => result.status === "incomplete"), humanReadableSummary: formatGenerationQualityBenchmarkSummary(report) }, null, 2));
}

void main();
