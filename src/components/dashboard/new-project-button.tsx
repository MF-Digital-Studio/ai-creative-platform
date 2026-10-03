"use client";

import {useActionState, useEffect} from "react";
import {useRouter} from "@/i18n/navigation";

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
  variant?: "primary" | "secondary";
  className?: string;
};

export function NewProjectButton({action, messages, variant = "secondary", className}: NewProjectButtonProps) {
  const [state, formAction, pending] = useActionState(action, initialCreateProjectState);
  const router = useRouter();
  useEffect(() => {
    if (state.projectId) router.push(`/dashboard/projects/${state.projectId}`);
  }, [router, state.projectId]);
  const hasError = state.status === "error";

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <Button type="submit" variant={variant} size="sm" className={className} disabled={pending} aria-busy={pending}>
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
