"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GenerationProgressModal } from "@/components/projects/generation-progress-modal";
import { GenerationStatusIndicator, type GenerationState } from "@/components/projects/generation-status-indicator";
import { AspectRatioPicker, type AspectRatioPickerMessages } from "@/components/projects/aspect-ratio-picker";
import { DEFAULT_GENERATION_ASPECT_RATIO } from "@/lib/generation/aspect-ratios";
import type { GenerationAspectRatio } from "@/lib/generation/types";
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
    invalidAspectRatio: string;
    aspectRatio: AspectRatioPickerMessages;
    progressTitle: string;
    progressDescription: string;
    progressStatuses: readonly [string, string, string, string];
    closeProgress: string; activeStatus: string; successStatus: string; failedStatus: string;
  };
};

export function GenerateImageForm({ action, messages }: GenerateImageFormProps) {
  const router = useRouter();
  const [generationState, setGenerationState] = useState<GenerationState>("idle");
  const [modalOpen, setModalOpen] = useState(false);
  const pending = generationState !== "idle" && generationState !== "succeeded" && generationState !== "failed";
  const [message, setMessage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<GenerationAspectRatio>(DEFAULT_GENERATION_ASPECT_RATIO);
  const pendingRef = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) return;
    pendingRef.current = true;
    const formData = new FormData(event.currentTarget);
    setMessage(null);
    setGenerationState("queued");
    setModalOpen(true);
    try {
      const queued = await action(null, formData);
      if (!queued.ok) { setGenerationState("failed"); setMessage(messages[queued.message]); pendingRef.current = false; return; }
      setGenerationState("processing");
      router.replace(`?generation=${encodeURIComponent(queued.generationId)}`);
      router.refresh();
    } catch { setGenerationState("failed"); setMessage(messages.generationFailed); pendingRef.current = false; }
  }

  return <>
    <form onSubmit={(event) => void handleSubmit(event)} className="project-control-section project-generate-form">
      {message ? <p role="alert" aria-live="assertive" className="project-generation-error">{message}</p> : null}
      <input type="hidden" name="enhance_with_ai" value="on" />
      <AspectRatioPicker value={aspectRatio} onChange={setAspectRatio} disabled={pending} messages={messages.aspectRatio} />
      <input type="hidden" name="aspect_ratio" value={aspectRatio} />
      <Button type="submit" variant="primary" size="md" disabled={pending} aria-busy={pending} className="project-generate-button">{pending ? messages.creating : messages.generate}</Button>
    </form>
    <GenerationStatusIndicator status={generationState} label={pending ? messages.activeStatus : generationState === "succeeded" ? messages.successStatus : messages.failedStatus} onClick={() => { if (generationState === "succeeded") { router.refresh(); return; } setModalOpen(true); }} />
      <GenerationProgressModal open={modalOpen && generationState !== "idle"} onClose={() => setModalOpen(false)} closeLabel={messages.closeProgress} title={generationState === "failed" ? messages.generationFailed : messages.progressTitle} description={messages.progressDescription} statuses={messages.progressStatuses} />
  </>;
}
