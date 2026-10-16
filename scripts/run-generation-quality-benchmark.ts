import { readFile } from "node:fs/promises";

import {
  type BenchmarkObservation,
  evaluateGenerationQualityBenchmark,
  formatGenerationQualityBenchmarkSummary,
} from "../src/lib/generation/benchmark/generation-quality-benchmark";

async function main() {
  const observationPath = process.argv[2];
  const observations: readonly BenchmarkObservation[] = observationPath
    ? await readObservations(observationPath)
    : [];
  const report = evaluateGenerationQualityBenchmark(observations);
  console.log(JSON.stringify({ ...report, humanReadableSummary: formatGenerationQualityBenchmarkSummary(report) }, null, 2));
}

async function readObservations(path: string): Promise<readonly BenchmarkObservation[]> {
  const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!Array.isArray(parsed)) throw new Error("Benchmark observations must be a JSON array.");
  return parsed as BenchmarkObservation[];
}

void main();
