"use client";

import { useState, type ReactNode } from "react";
import { GenerationGallery, type GenerationGalleryItem } from "@/components/projects/generation-gallery";
import { ImageEditPanel } from "@/components/projects/image-edit-panel";
import type { CreateImageEditResult } from "@/app/[locale]/dashboard/projects/[projectId]/generation-actions";

type Props = {
  items: GenerationGalleryItem[];
  runActions: { id: string; node: ReactNode }[];
  controls: ReactNode;
  editAction: (baseGenerationId: string, instruction: string) => Promise<CreateImageEditResult>;
  editMessages: React.ComponentProps<typeof ImageEditPanel>["messages"];
  hasOutput: boolean;
  messages: React.ComponentProps<typeof GenerationGallery>["messages"];
};

export function ProjectGenerationWorkspace({ items, runActions, controls, editAction, editMessages, hasOutput, messages }: Props) {
  const defaultSelected = items.find((item) => item.previewUrl && item.status === "succeeded")?.id ?? null;
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(defaultSelected);
  function selectEditedGeneration(generationId: string) {
    setSelectedGenerationId(generationId);
  }
  return <GenerationGallery items={items} runActions={runActions} messages={messages} onSelectionChange={setSelectedGenerationId} controls={<>
    {controls}
    <ImageEditPanel hasOutput={hasOutput} selectedGenerationId={selectedGenerationId} onEditSucceeded={selectEditedGeneration} action={editAction} messages={editMessages} />
  </>} />;
}
