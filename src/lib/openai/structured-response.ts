import "server-only";

type StructuredOutputFormat = {
  type: "json_schema";
  name: string;
  description: string;
  schema: Record<string, unknown>;
  strict: true;
};

export { getOpenAIDiagnostic, type OpenAIDiagnostic } from "./response-diagnostics";

export function structuredResponseText(format: StructuredOutputFormat) {
  // `text.verbosity` is not required for structured output and is not uniformly
  // accepted by the configured legacy vision model. Keep this shared request shape portable.
  return { format };
}
