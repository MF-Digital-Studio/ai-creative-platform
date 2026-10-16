import type { FidelityValidationStatus } from "@/lib/fidelity-validation/types";

import type {
  BenchmarkObservation,
  BenchmarkEvidenceSource,
  HumanVisualReview,
  SourceGenerationTerminalStatus,
} from "./generation-quality-benchmark";

type JsonRecord = Record<string, unknown>;

export type RedactedPersistedGenerationRecord = {
  status: unknown;
  processingDurationMs?: unknown;
  providerMetadata?: unknown;
};

export type PersistedGenerationBenchmarkInput = {
  fixtureId: string;
  generation: RedactedPersistedGenerationRecord;
  humanVisualReview?: HumanVisualReview;
  evidenceSource?: BenchmarkEvidenceSource;
};

export type PersistedGenerationBenchmarkAdapterResult =
  | { status: "ready"; observation: BenchmarkObservation }
  | { status: "incomplete"; sourceTerminalStatus: SourceGenerationTerminalStatus; reasons: readonly string[] };

const validationStatuses = new Set<FidelityValidationStatus>(["pass", "pass_with_warnings", "fail", "validation_unavailable"]);
const generationStatuses = new Set<SourceGenerationTerminalStatus>(["queued", "processing", "succeeded", "failed"]);
const issueCodePattern = /^[A-Za-z0-9_-]{1,120}$/;
const humanVisualReviews = new Set<HumanVisualReview>(["not_reviewed", "pass", "warning", "fail"]);
const evidenceSources = new Set<BenchmarkEvidenceSource>(["synthetic", "persisted_production", "unknown"]);

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valueAt(record: JsonRecord, key: string): unknown {
  return record[key];
}

function nullableBoolean(value: unknown): boolean | null | undefined {
  return value === null || typeof value === "boolean" ? value : undefined;
}

function nonNegativeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function parseIssueCodes(value: unknown): readonly string[] | null {
  if (!Array.isArray(value) || !value.every((code) => typeof code === "string" && issueCodePattern.test(code))) return null;
  return value;
}

type PersistedValidation = { status: FidelityValidationStatus; commerciallyUsable: boolean | null; issueCodes: readonly string[] };

function parseValidation(value: unknown): PersistedValidation | null {
  if (!isRecord(value)) return null;
  const status = valueAt(value, "status");
  const commerciallyUsable = nullableBoolean(valueAt(value, "commerciallyUsable"));
  const issueCodes = parseIssueCodes(valueAt(value, "issueCodes"));
  if (typeof status !== "string" || !validationStatuses.has(status as FidelityValidationStatus) || commerciallyUsable === undefined || issueCodes === null) return null;
  return { status: status as FidelityValidationStatus, commerciallyUsable, issueCodes };
}

function sameValidation(left: PersistedValidation, right: PersistedValidation): boolean {
  return left.status === right.status
    && left.commerciallyUsable === right.commerciallyUsable
    && left.issueCodes.length === right.issueCodes.length
    && left.issueCodes.every((code, index) => code === right.issueCodes[index]);
}

function incomplete(status: SourceGenerationTerminalStatus, reasons: string[]): PersistedGenerationBenchmarkAdapterResult {
  return { status: "incomplete", sourceTerminalStatus: status, reasons };
}

/**
 * Converts a caller-supplied, redacted record only. It neither queries Supabase
 * nor returns raw metadata, URLs, prompts, identifiers, or provider diagnostics.
 */
export function adaptPersistedGenerationForBenchmark(input: PersistedGenerationBenchmarkInput): PersistedGenerationBenchmarkAdapterResult {
  const humanVisualReview = input.humanVisualReview ?? "not_reviewed";
  if (!humanVisualReviews.has(humanVisualReview)) throw new Error("Benchmark record has an invalid human visual review.");
  const evidenceSource = input.evidenceSource ?? "unknown";
  if (!evidenceSources.has(evidenceSource)) throw new Error("Benchmark record has an invalid evidence source.");
  const sourceTerminalStatus = input.generation.status;
  if (typeof sourceTerminalStatus !== "string" || !generationStatuses.has(sourceTerminalStatus as SourceGenerationTerminalStatus)) {
    throw new Error("Benchmark record has an unsupported generation status.");
  }
  const terminalStatus = sourceTerminalStatus as SourceGenerationTerminalStatus;
  if (terminalStatus === "queued" || terminalStatus === "processing") return incomplete(terminalStatus, ["generation_not_terminal"]);
  if (!isRecord(input.generation.providerMetadata)) return incomplete(terminalStatus, ["provider_metadata_missing"]);
  const metadata = input.generation.providerMetadata;
  const validation = parseValidation(metadata.validation);
  const fidelityValidation = parseValidation(metadata.fidelity_validation);
  if (validation && fidelityValidation && !sameValidation(validation, fidelityValidation)) {
    throw new Error("Benchmark record has contradictory persisted validation metadata.");
  }
  const selectedValidation = validation ?? fidelityValidation;
  if (!selectedValidation) return incomplete(terminalStatus, ["validation_metadata_missing_or_invalid"]);

  const qualityGatePassed = nullableBoolean(metadata.qualityGatePassed);
  if (qualityGatePassed === undefined) return incomplete(terminalStatus, ["quality_gate_metadata_missing_or_invalid"]);
  const validationUnavailable = metadata.validationUnavailable;
  const verificationStatus = metadata.verificationStatus;
  if (validationUnavailable !== undefined && validationUnavailable !== (selectedValidation.status === "validation_unavailable")) {
    throw new Error("Benchmark record has contradictory validation availability metadata.");
  }
  if (verificationStatus !== undefined && verificationStatus !== (selectedValidation.status === "validation_unavailable" ? "unverified" : "verified")) {
    throw new Error("Benchmark record has contradictory verification metadata.");
  }
  if (selectedValidation.status === "validation_unavailable" && (qualityGatePassed !== null || selectedValidation.commerciallyUsable !== null)) {
    throw new Error("Benchmark record marks unavailable validation as verified.");
  }
  if (selectedValidation.status !== "validation_unavailable" && qualityGatePassed === null) {
    throw new Error("Benchmark record has a non-terminal quality gate result.");
  }

  const qualityRejected = metadata.qualityRejected;
  if (qualityRejected !== undefined && qualityRejected !== (qualityGatePassed === false)) {
    throw new Error("Benchmark record has contradictory quality gate metadata.");
  }
  const derivedRejected = selectedValidation.status === "fail" || qualityGatePassed === false || selectedValidation.commerciallyUsable === false;
  if (terminalStatus === "succeeded" && derivedRejected) throw new Error("Benchmark record marks a rejected generation as succeeded.");
  if (terminalStatus === "failed" && !derivedRejected) return incomplete(terminalStatus, ["failed_without_quality_rejection_metadata"]);

  const autoRepair = isRecord(metadata.auto_repair) ? metadata.auto_repair : null;
  const attempted = autoRepair ? nullableBoolean(autoRepair.attempted) : null;
  if (attempted === undefined) return incomplete(terminalStatus, ["repair_metadata_invalid"]);
  const selectedAttempt = autoRepair?.selectedAttempt;
  if (selectedAttempt !== undefined && selectedAttempt !== null && selectedAttempt !== 0 && selectedAttempt !== 1) {
    throw new Error("Benchmark record has an invalid selected repair attempt.");
  }
  const costTelemetry = isRecord(metadata.costTelemetry) ? metadata.costTelemetry : null;
  const providerCallCount = costTelemetry ? nonNegativeNumber(costTelemetry.totalExternalAICalls) : null;

  return {
    status: "ready",
    observation: {
      fixtureId: input.fixtureId,
      sourceTerminalStatus: terminalStatus,
      validation: {
        status: selectedValidation.status,
        commerciallyUsable: selectedValidation.commerciallyUsable,
        issues: [],
        ...(selectedValidation.issueCodes.length ? { unclassifiedIssueCodes: selectedValidation.issueCodes } : {}),
      },
      qualityGatePassed,
      repair: { attempted, selectedAttempt: selectedAttempt ?? null },
      providerCallCount,
      latencyMs: nonNegativeNumber(input.generation.processingDurationMs),
      // A persisted aggregate cost is not enough to prove complete usage and pricing.
      cost: { estimatedUsd: null, usageComplete: false, pricingComplete: false },
      humanVisualReview,
      evidenceSource,
    },
  };
}
