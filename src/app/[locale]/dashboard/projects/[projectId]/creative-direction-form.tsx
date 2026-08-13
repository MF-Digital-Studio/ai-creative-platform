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
    <form action={formAction} className="grid gap-4 border-t border-[var(--dashboard-border)] pt-6">
      <div className="grid gap-2">
        <label htmlFor="creative-direction" className="text-sm font-medium text-[var(--dashboard-foreground)]">
          {messages.label}
        </label>
        <p id="creative-direction-description" className="text-sm leading-6 text-[var(--dashboard-muted)]">
          {messages.description}
        </p>
        <textarea
          key={creativeDirection ?? "empty"}
          id="creative-direction"
          name="creative_direction"
          defaultValue={creativeDirection ?? ""}
          maxLength={4000}
          rows={5}
          aria-describedby="creative-direction-description"
          aria-invalid={isError || undefined}
          placeholder={messages.placeholder}
          className="min-h-32 w-full resize-y rounded-[var(--radius-sm)] border border-[var(--dashboard-border-strong)] bg-[var(--dashboard-background)] px-3 py-2.5 text-sm leading-6 text-[var(--dashboard-foreground)] outline-none transition-colors placeholder:text-[var(--dashboard-muted-soft)] focus-visible:border-[var(--accent)] focus-visible:ring-4 focus-visible:ring-[var(--dashboard-focus)]"
        />
      </div>

      {message ? (
        <p
          role={isError ? "alert" : "status"}
          aria-live={isError ? "assertive" : "polite"}
          className={isError ? "text-sm text-red-300" : "text-sm text-emerald-300"}
        >
          {message}
        </p>
      ) : null}

      <Button type="submit" variant="primary" size="md" disabled={pending} aria-busy={pending}>
        {pending ? messages.saving : messages.save}
      </Button>
    </form>
  );
}
