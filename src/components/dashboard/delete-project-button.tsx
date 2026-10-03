"use client";

import {useActionState, useEffect, useId, useRef, useState} from "react";
import {useRouter} from "@/i18n/navigation";

import type {DeleteProjectState} from "@/app/[locale]/dashboard/actions";
import {Button} from "@/components/ui/button";

const initialState: DeleteProjectState = {status: "idle"};

type DeleteProjectButtonProps = {
  action: (
    previousState: DeleteProjectState,
    formData: FormData,
  ) => Promise<DeleteProjectState>;
  messages: {
    label: string;
    confirmHeading: string;
    confirm: string;
    cancel: string;
    deleting: string;
    error: string;
  };
  trigger?: "button" | "menu";
};

export function DeleteProjectButton({action, messages, trigger = "button"}: DeleteProjectButtonProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const dialogHeadingId = useId();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => { if (state.status === "success") router.refresh(); }, [state.status, router]);

  function openDialog() {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      setIsOpen(true);
    }
  }

  function closeDialog() {
    dialogRef.current?.close();
    setIsOpen(false);
  }

  return (
    <div className="dashboard-project-delete-form">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={trigger === "menu" ? "project-menu-delete-button" : "dashboard-project-delete-button"}
        onClick={openDialog}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        {messages.label}
      </Button>

      <dialog
        ref={dialogRef}
        className="dashboard-delete-dialog"
        aria-labelledby={dialogHeadingId}
        onClose={() => setIsOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget && !pending) {
            closeDialog();
          }
        }}
      >
        <div className="dashboard-delete-dialog-content">
          <h2 id={dialogHeadingId}>{messages.confirmHeading}</h2>
          <p>{messages.confirm}</p>
          {state.status === "error" ? <p role="alert">{messages.error}</p> : null}
          <div className="dashboard-delete-dialog-actions">
            <Button type="button" variant="secondary" size="sm" onClick={closeDialog} disabled={pending}>
              {messages.cancel}
            </Button>
            <form action={formAction}>
              <Button type="submit" variant="primary" size="sm" disabled={pending} aria-busy={pending}>
                {pending ? messages.deleting : messages.label}
              </Button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
}
