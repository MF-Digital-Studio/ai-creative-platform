"use client";

import {useActionState} from "react";

import {Button} from "@/components/ui/button";
import type {CreateProjectState} from "@/app/[locale]/dashboard/actions";

const initialCreateProjectState: CreateProjectState = {status: "idle"};

type NewProjectButtonProps = {
  action: (
    previousState: CreateProjectState,
    formData: FormData,
  ) => Promise<CreateProjectState>;
  messages: {
    create: string;
    creating: string;
    error: string;
  };
};

export function NewProjectButton({action, messages}: NewProjectButtonProps) {
  const [state, formAction, pending] = useActionState(action, initialCreateProjectState);
  const hasError = state.status === "error";

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <Button type="submit" variant="secondary" size="sm" disabled={pending} aria-busy={pending}>
        {pending ? messages.creating : messages.create}
      </Button>
      {hasError ? (
        <p role="alert" className="text-sm text-red-300">
          {messages.error}
        </p>
      ) : null}
    </form>
  );
}
