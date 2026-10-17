"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import {
  type UpdateCreativeDirectionState,
  updateCreativeDirection,
} from "./actions";

const initialCreativeDirectionState: UpdateCreativeDirectionState = { status: "idle" };

type CreativeDirectionFormProps = {
  creativeDirection: string | null;
  projectId: string;
  locale: "en" | "tr";
  messages: {
    label: string;
    description: string;
    placeholder: string;
    save: string;
    saving: string;
    validationError: string;
    saveError: string;
    saveSuccess: string;
  };
};

export function CreativeDirectionForm({
  creativeDirection,
  projectId,
  locale,
  messages,
}: CreativeDirectionFormProps) {
  const [state, formAction, pending] = useActionState(
    updateCreativeDirection.bind(null, locale, projectId),
    initialCreativeDirectionState,
  );
  const message =
    state.status === "validation"
      ? messages.validationError
      : state.status === "error"
        ? messages.saveError
        : state.status === "success"
          ? messages.saveSuccess
          : null;
  const isError = state.status === "validation" || state.status === "error";

  return (
    <form action={formAction} className="project-control-section project-direction-form">
      <div className="grid gap-2">
        <label htmlFor="creative-direction" className="text-sm font-medium text-[var(--dashboard-foreground)]">
          {messages.label}
        </label>
        <p className="project-direction-description">{messages.description}</p>
        <textarea
          key={creativeDirection ?? "empty"}
          id="creative-direction"
          name="creative_direction"
          defaultValue={creativeDirection ?? ""}
          maxLength={4000}
          rows={4}
          aria-invalid={isError || undefined}
          placeholder={messages.placeholder}
          className="project-direction-textarea"
        />
      </div>

      {message ? (
        <p
          role={isError ? "alert" : "status"}
          aria-live={isError ? "assertive" : "polite"}
          className="project-direction-message"
        >
          {message}
        </p>
      ) : null}

      <Button type="submit" variant="secondary" size="sm" disabled={pending} aria-busy={pending} className="project-direction-save">
        {pending ? messages.saving : messages.save}
      </Button>
    </form>
  );
}
