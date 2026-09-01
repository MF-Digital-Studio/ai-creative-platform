type OpenAIErrorLike = {
  code?: unknown;
  status?: unknown;
  type?: unknown;
  message?: unknown;
};

export type OpenAIDiagnostic = {
  errorCode: string | null;
  errorType: string | null;
  safeMessage: string;
  status: number | null;
};

export function getOpenAIDiagnostic(error: unknown): OpenAIDiagnostic {
  const candidate = error && typeof error === "object" ? error as OpenAIErrorLike : null;
  const safeMessage = typeof candidate?.message === "string"
    ? candidate.message
      .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]")
      .replace(/data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi, "[redacted image]")
      .replace(/https?:\/\/\S+/g, "[redacted URL]")
      .slice(0, 300)
    : "OpenAI request failed.";

  return {
    status: typeof candidate?.status === "number" ? candidate.status : null,
    errorType: typeof candidate?.type === "string" ? candidate.type : null,
    errorCode: typeof candidate?.code === "string" ? candidate.code : null,
    safeMessage,
  };
}
