"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import type { CreateQueuedImageGenerationResult } from "./actions";

const initialGenerationState = null;

type GenerateImageFormProps = {
  action: (
    state: CreateQueuedImageGenerationResult | null,
  ) => Promise<CreateQueuedImageGenerationResult>;
  messages: {
    generate: string;
    creating: string;
    missingProductImage: string;
    missingCreativeDirection: string;
    creationFailed: string;
  };
};

export function GenerateImageForm({ action, messages }: GenerateImageFormProps) {
  const [state, formAction, pending] = useActionState(action, initialGenerationState);
  const message = state?.ok === false ? messages[state.message] : null;

  return (
    <form action={formAction} className="grid gap-3 border-t border-[var(--dashboard-border)] pt-6">
      {message ? (
        <p role="alert" aria-live="assertive" className="text-sm text-red-300">
          {message}
        </p>
      ) : null}

      <Button type="submit" variant="primary" size="md" disabled={pending} aria-busy={pending}>
        {pending ? messages.creating : messages.generate}
      </Button>
    </form>
  );
}
