"use client";

import { useEffect } from "react";
import type { GenerationGalleryItem } from "@/components/projects/generation-gallery";

export function SelectedGenerationBridge({ items }: { items: GenerationGalleryItem[] }) {
  useEffect(() => {
    function updateSelectedOutput() {
      const selected = document.querySelector<HTMLButtonElement>(".project-generation-history-select[aria-pressed='true'], .project-gallery-thumbnail[aria-pressed='true']");
      const selectedIndex = selected?.getAttribute("aria-label")?.match(/(\d+)$/)?.[1];
      const previewButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".project-gallery-thumbnail"));
      const item = selected?.classList.contains("project-gallery-thumbnail")
        ? items.find((candidate, index) => candidate.previewUrl && index === Number(selectedIndex) - 1)
        : items.find((candidate) => candidate.previewUrl && candidate.createdAt && selected?.getAttribute("aria-label")?.includes(candidate.createdAt));
      const selectedId = item?.status === "succeeded" ? item.id : "";
      const input = document.querySelector<HTMLInputElement>("input[name='selected_generation_id']");
      if (input) input.value = selectedId;
      void previewButtons;
    }
    updateSelectedOutput();
    const observer = new MutationObserver(updateSelectedOutput);
    const gallery = document.querySelector(".project-review-panel");
    if (gallery) observer.observe(gallery, { attributes: true, subtree: true, attributeFilter: ["aria-pressed"] });
    return () => observer.disconnect();
  }, [items]);
  return null;
}
