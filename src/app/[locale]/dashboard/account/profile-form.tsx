"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { updateDisplayName, type UpdateProfileState } from "./actions";

const initialUpdateProfileState: UpdateProfileState = { status: "idle" };

type ProfileFormProps = {
  displayName: string | null;
  messages: {
    displayNameLabel: string;
    displayNameHelper: string;
    save: string;
    saving: string;
    validationError: string;
    saveError: string;
    saveSuccess: string;
  };
};

export function ProfileForm({ displayName, messages }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateDisplayName,
    initialUpdateProfileState,
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
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-2">
        <label htmlFor="display-name" className="text-sm font-medium text-[var(--dashboard-foreground)]">
          {messages.displayNameLabel}
        </label>
        <input
          key={displayName ?? "empty"}
          id="display-name"
          name="display_name"
          type="text"
          autoComplete="off"
          defaultValue={displayName ?? ""}
          aria-invalid={isError || undefined}
          aria-describedby="display-name-helper"
          className="min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--dashboard-border-strong)] bg-[var(--dashboard-background)] px-3 text-sm text-[var(--dashboard-foreground)] outline-none transition-colors placeholder:text-[var(--dashboard-muted-soft)] focus-visible:border-[var(--dashboard-foreground)] focus-visible:ring-4 focus-visible:ring-[var(--dashboard-focus)]"
        />
        <p id="display-name-helper" className="text-sm leading-6 text-[var(--dashboard-muted)]">
          {messages.displayNameHelper}
        </p>
      </div>

      {message ? (
        <p
          role={isError ? "alert" : "status"}
          aria-live={isError ? "assertive" : "polite"}
          className={isError ? "text-sm text-[var(--dashboard-danger)]" : "text-sm text-[var(--dashboard-success)]"}
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
