import type { GenerationProvider } from "../types";

type ProviderErrorShape = { status?: unknown; code?: unknown; type?: unknown; param?: unknown; message?: unknown; cause?: unknown };
const text = (value: unknown) => typeof value === "string" ? value.slice(0, 500) : null;
const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;

/** Extracts only safe provider fields; prompts, URLs and image payloads are never read. */
export function getSafeProviderErrorDiagnostics(error: unknown, input: {
  generationId: string; provider: GenerationProvider; model: string; imageCount: number;
  preservationMode: string; strategy: string; sceneFamily: string | null;
}) {
  const outer = error && typeof error === "object" ? error as ProviderErrorShape : {};
  const source = outer.cause && typeof outer.cause === "object" ? outer.cause as ProviderErrorShape : outer;
  return {
    generationId: input.generationId, provider: input.provider, model: input.model,
    status: number(source.status) ?? number(outer.status), code: text(source.code) ?? text(outer.code),
    type: text(source.type) ?? text(outer.type), param: text(source.param) ?? text(outer.param),
    message: text(source.message) ?? text(outer.message) ?? "Unknown provider error",
    imageCount: input.imageCount, preservationMode: input.preservationMode,
    strategy: input.strategy, sceneFamily: input.sceneFamily,
  };
}
