"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";

export function ImageEditPanel({ hasOutput, messages }: { hasOutput: boolean; messages: { title: string; description: string; placeholder: string; helper: string; apply: string; unavailable: string } }) {
  const inputId = useId();
  return <section className="project-control-section project-image-edit" aria-labelledby={`${inputId}-title`}>
    <h3 id={`${inputId}-title`}>{messages.title}</h3><p>{messages.description}</p>
    <label className="sr-only" htmlFor={inputId}>{messages.title}</label>
    <textarea id={inputId} className="project-direction-textarea" placeholder={messages.placeholder} disabled={!hasOutput} />
    <p>{messages.helper}</p>
    <Button type="button" variant="primary" size="md" className="project-generate-button" disabled title={messages.unavailable}>{messages.apply}</Button>
    <p className="project-edit-unavailable" role="status">{messages.unavailable}</p>
  </section>;
}
