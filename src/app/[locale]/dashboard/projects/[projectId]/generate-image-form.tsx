"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { EnhanceWithAIToggle } from "@/components/ui/enhance-with-ai-toggle";

import type { CreateQueuedImageGenerationResult } from "./actions";

const initialGenerationState = null;

type GenerateImageFormProps = {
  action: (
    state: CreateQueuedImageGenerationResult | null,
    formData: FormData,
  ) => Promise<CreateQueuedImageGenerationResult>;
  messages: {
    generate: string;
    creating: string;
    missingProductImage: string;
    missingCreativeDirection: string;
    creationFailed: string;
    enhanceWithAI: string;
    enhanceWithAIHelper: string;
  };
};

export function GenerateImageForm({ action, messages }: GenerateImageFormProps) {
  const [state, formAction, pending] = useActionState(action, initialGenerationState);
  const [enhanceWithAI, setEnhanceWithAI] = useState(true);
  const message = state?.ok === false ? messages[state.message] : null;

  return (
    <form action={formAction} className="grid gap-3 border-t border-[var(--dashboard-border)] pt-6">
      {message ? (
        <p role="alert" aria-live="assertive" className="text-sm text-red-300">
          {message}
        </p>
      ) : null}

      <EnhanceWithAIToggle
        checked={enhanceWithAI}
        description={messages.enhanceWithAIHelper}
        disabled={pending}
        label={messages.enhanceWithAI}
        name="enhance_with_ai"
        onChange={setEnhanceWithAI}
      />

      <Button type="submit" variant="primary" size="md" disabled={pending} aria-busy={pending}>
        {pending ? messages.creating : messages.generate}
      </Button>
    </form>
  );
}
