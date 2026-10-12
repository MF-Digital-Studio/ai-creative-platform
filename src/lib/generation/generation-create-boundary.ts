export type GenerationInsertError = {
  code?: unknown;
  message?: unknown;
  details?: unknown;
  hint?: unknown;
};

export type SafeGenerationInsertError = {
  code: string | null;
  message: string | null;
  details: string | null;
  hint: string | null;
};

const sensitiveValuePattern = /(?:bearer\s+[a-z0-9._-]+|sk-[a-z0-9_-]+|eyj[a-z0-9._-]+|data:image\/[^;]+;base64,[a-z0-9+/=]+)/gi;

function safeErrorField(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim().replace(sensitiveValuePattern, "[REDACTED]").slice(0, 1000);
}

export function toSafeGenerationInsertError(error: GenerationInsertError | unknown): SafeGenerationInsertError {
  const record = error && typeof error === "object" ? error as GenerationInsertError : {};
  return {
    code: safeErrorField(record.code),
    message: safeErrorField(record.message),
    details: safeErrorField(record.details),
    hint: safeErrorField(record.hint),
  };
}

export function logGenerationInsertFailure(
  error: GenerationInsertError | unknown,
  logger: (message: string, fields: SafeGenerationInsertError) => void = console.error,
): SafeGenerationInsertError {
  const fields = toSafeGenerationInsertError(error);
  logger("[generation-create] insert_failed", fields);
  return fields;
}

export function serializeGenerationMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const serialized = JSON.stringify(metadata);
  if (!serialized) throw new TypeError("Generation metadata is not JSON-serializable.");
  const parsed: unknown = JSON.parse(serialized);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new TypeError("Generation metadata must serialize to an object.");
  return parsed as Record<string, unknown>;
}

export function resolveCreativeDirectionSnapshot(fullDirection: string, userDirection: string, maxLength = 4000): string | null {
  const userSnapshot = userDirection.trim();
  if (!fullDirection.trim() || !userSnapshot || Array.from(userSnapshot).length > maxLength) return null;
  return userSnapshot;
}

export function resolveGenerationInsertResult<T extends { id: string }>(
  result: { data: T | null; error: GenerationInsertError | null },
  logger?: (message: string, fields: SafeGenerationInsertError) => void,
): { ok: true; generation: T } | { ok: false; error: SafeGenerationInsertError } {
  if (result.error || !result.data) {
    return { ok: false, error: logGenerationInsertFailure(result.error ?? { code: "EMPTY_INSERT_RESULT", message: "Generation insert returned no row." }, logger) };
  }
  return { ok: true, generation: result.data };
}
