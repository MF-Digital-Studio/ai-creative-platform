import "server-only";

import OpenAI from "openai";

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to create the OpenAI client on the server.");
  }

  return new OpenAI({ apiKey });
}
