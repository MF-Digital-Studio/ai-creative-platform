"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GenerationProgressModal } from "@/components/projects/generation-progress-modal";
import { type CreateQueuedImageGenerationResult } from "./generation-actions";

type GenerateImageFormProps = {
  action: (state: CreateQueuedImageGenerationResult | null, formData: FormData) => Promise<CreateQueuedImageGenerationResult>;
  messages: {
    generate: string;
    creating: string;
    missingProductImage: string;
    missingCreativeDirection: string;
    creationFailed: string;
    generationFailed: string;
    progressTitle: string;
    progressDescription: string;
    progressStatuses: readonly [string, string, string, string];
  };
};

export function GenerateImageForm({ action, messages }: GenerateImageFormProps) {
  const router = useRouter();
  const [generationState, setGenerationState] = useState<"idle" | "pending" | "failed">("idle");
  const pending = generationState === "pending";
  const [message, setMessage] = useState<string | null>(null);
  const pendingRef = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) return;
    pendingRef.current = true;
    const formData = new FormData(event.currentTarget);
    setMessage(null);
    setGenerationState("pending");
    try {
      const queued = await action(null, formData);
      if (!queued.ok) { setGenerationState("failed"); setMessage(messages[queued.message]); pendingRef.current = false; setGenerationState("idle"); return; }
      router.refresh();
    } catch { setGenerationState("failed"); setMessage(messages.generationFailed); pendingRef.current = false; setGenerationState("idle"); }
  }

  return <>
    <form onSubmit={(event) => void handleSubmit(event)} className="project-control-section project-generate-form">
      {message ? <p role="alert" aria-live="assertive" className="project-generation-error">{message}</p> : null}
      <input type="hidden" name="enhance_with_ai" value="on" />
      <Button type="submit" variant="primary" size="md" disabled={pending} aria-busy={pending} className="project-generate-button">{pending ? messages.creating : messages.generate}</Button>
    </form>
    <GenerationProgressModal open={generationState === "pending"} title={messages.progressTitle} description={messages.progressDescription} statuses={messages.progressStatuses} />
  </>;
}
