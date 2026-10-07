"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { updateDisplayName, type UpdateProfileState } from "./actions";

const initialUpdateProfileState: UpdateProfileState = { status: "idle" };

type ProfileFormProps = {
  displayName: string | null;
  messages: {
    profileLabel: string;
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
  const initial = displayName?.trim().charAt(0).toLocaleUpperCase() || "K";

  return (
    <form action={formAction} className="account-profile-form">
      <div className="account-profile-identity" aria-label={messages.profileLabel}>
        <span className="account-profile-avatar" aria-hidden="true">{initial}</span>
        <span className="account-profile-copy">
          <strong>{displayName || messages.displayNameLabel}</strong>
          <span>{messages.displayNameHelper}</span>
        </span>
      </div>

      <div className="account-profile-field">
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
          className="account-profile-input"
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

      <div className="account-profile-actions">
        <Button type="submit" variant="primary" size="sm" disabled={pending} aria-busy={pending}>
          {pending ? messages.saving : messages.save}
        </Button>
      </div>
    </form>
  );
}
