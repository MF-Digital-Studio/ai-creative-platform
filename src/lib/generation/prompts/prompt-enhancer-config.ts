import "server-only";

const defaultPromptEnhancementModel = "gpt-4o-mini";

export function getPromptEnhancementModel() {
  const configuredModel = process.env.OPENAI_PROMPT_ENHANCEMENT_MODEL?.trim();

  return configuredModel || defaultPromptEnhancementModel;
}
