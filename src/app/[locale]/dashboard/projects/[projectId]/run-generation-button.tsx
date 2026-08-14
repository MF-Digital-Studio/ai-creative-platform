"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import type { RunQueuedImageGenerationResult } from "./actions";

type RunGenerationButtonProps = {
  action: () => Promise<RunQueuedImageGenerationResult>;
  messages: {
    run: string;
    running: string;
    generationFailed: string;
    notQueued: string;
  };
};

export function RunGenerationButton({ action, messages }: RunGenerationButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function runGeneration() {
    setError(null);

    startTransition(async () => {
      try {
        const result = await action();
        if (result.ok) {
          router.refresh();
          return;
        }

        setError(messages[result.message]);
      } catch {
        setError(messages.generationFailed);
      }
    });
  }

  return (
    <div className="grid gap-2">
      {error ? (
        <p role="alert" aria-live="assertive" className="text-sm text-red-300">
          {error}
        </p>
      ) : null}
      <Button type="button" variant="secondary" size="sm" onClick={runGeneration} disabled={isPending} aria-busy={isPending}>
        {isPending ? messages.running : messages.run}
      </Button>
    </div>
  );
}
