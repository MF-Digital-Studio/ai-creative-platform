"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { getPasswordChangeError, maskEmail, type PasswordChangeError } from "@/lib/auth/password-change";
import { createClient } from "@/lib/supabase/client";

type Stage = "request" | "verify" | "success";

type PasswordChangeMessages = {
  cancel: string; changePassword: string; codeLabel: string; confirmPassword: string; done: string;
  emailVerificationDescription: string; invalidNonce: string; network: string; newPassword: string;
  passwordMismatch: string; passwordRequired: string; rateLimited: string; requestSent: string;
  resend: string; resendCountdown: string; sendCode: string; sendingCode: string; sessionExpired: string;
  sessionExpiredAction: string; successDescription: string; successTitle: string; unknown: string;
  updatePassword: string; updatingPassword: string; verifyTitle: string; weakPassword: string;
};

type PasswordChangeControlProps = {
  email: string;
  messages: PasswordChangeMessages;
  signInHref: string;
};

const COOLDOWN_SECONDS = 60;

export function PasswordChangeControl({ email, messages, signInHref }: PasswordChangeControlProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const [stage, setStage] = useState<Stage>("request");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<PasswordChangeError | "passwordMismatch" | "passwordRequired">();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (stage !== "verify") return;
    const frame = window.requestAnimationFrame(() => codeRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [stage]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  function reset() {
    setStage("request"); setCode(""); setNewPassword(""); setConfirmation(""); setError(undefined); setCooldown(0);
  }

  function close() {
    if (isPending) return;
    dialogRef.current?.close();
    reset();
  }

  async function ensureAuthenticated() {
    const { data, error: userError } = await createClient().auth.getUser();
    return !userError && Boolean(data.user);
  }

  async function requestCode() {
    if (isPending) return;
    setError(undefined); setIsPending(true);
    try {
      if (!(await ensureAuthenticated())) { setError("sessionExpired"); return; }
      const { error: requestError } = await createClient().auth.reauthenticate();
      if (requestError) { setError(getPasswordChangeError(requestError)); return; }
      setCode(""); setStage("verify"); setCooldown(COOLDOWN_SECONDS);
    } catch { setError("network"); } finally { setIsPending(false); }
  }

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    setError(undefined);
    if (!code || !newPassword || !confirmation) { setError("passwordRequired"); return; }
    if (newPassword !== confirmation) { setError("passwordMismatch"); return; }
    setIsPending(true);
    try {
      if (!(await ensureAuthenticated())) { setError("sessionExpired"); return; }
      const { error: updateError } = await createClient().auth.updateUser({ password: newPassword, nonce: code });
      if (updateError) { setError(getPasswordChangeError(updateError)); return; }
      setCode(""); setNewPassword(""); setConfirmation(""); setError(undefined); setStage("success");
    } catch { setError("network"); } finally { setIsPending(false); }
  }

  const errorMessage = error ? messages[error] : undefined;
  const inputError = error === "invalidNonce" || error === "weakPassword" || error === "passwordMismatch" || error === "passwordRequired";

  return <>
    <Button type="button" variant="secondary" size="md" onClick={() => dialogRef.current?.showModal()}>{messages.changePassword}</Button>
    <dialog ref={dialogRef} className="delete-project-dialog password-change-dialog" aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={(event) => { if (isPending) event.preventDefault(); else reset(); }} onClose={reset} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="password-change-dialog-content">
        {stage === "success" ? <>
          <h2 id={titleId}>{messages.successTitle}</h2><p id={descriptionId} role="status" aria-live="polite">{messages.successDescription}</p>
          <div className="delete-project-dialog-actions"><Button type="button" onClick={close}>{messages.done}</Button></div>
        </> : stage === "request" ? <>
          <h2 id={titleId}>{messages.changePassword}</h2><p id={descriptionId}>{messages.emailVerificationDescription}</p>
          <p className="password-change-email">{maskEmail(email)}</p>
          {errorMessage ? <p role="alert">{errorMessage}{error === "sessionExpired" ? <> <a href={signInHref}>{messages.sessionExpiredAction}</a></> : null}</p> : null}
          <div className="delete-project-dialog-actions"><Button type="button" variant="secondary" onClick={close} disabled={isPending}>{messages.cancel}</Button><Button type="button" onClick={requestCode} disabled={isPending} aria-busy={isPending}>{isPending ? messages.sendingCode : messages.sendCode}</Button></div>
        </> : <>
          <h2 id={titleId}>{messages.verifyTitle}</h2><p id={descriptionId}>{messages.requestSent}</p>
          <form onSubmit={updatePassword} className="password-change-form">
            <label htmlFor="password-change-code">{messages.codeLabel}</label><input ref={codeRef} id="password-change-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" maxLength={8} required aria-invalid={inputError || undefined} aria-describedby={inputError ? errorId : undefined} />
            <label htmlFor="password-change-new">{messages.newPassword}</label><input id="password-change-new" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" required aria-invalid={inputError || undefined} aria-describedby={inputError ? errorId : undefined} />
            <label htmlFor="password-change-confirm">{messages.confirmPassword}</label><input id="password-change-confirm" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" required aria-invalid={inputError || undefined} aria-describedby={inputError ? errorId : undefined} />
            {errorMessage ? <p id={inputError ? errorId : undefined} role="alert">{errorMessage}{error === "sessionExpired" ? <> <a href={signInHref}>{messages.sessionExpiredAction}</a></> : null}</p> : null}
            <div className="password-change-resend"><Button type="button" variant="ghost" size="sm" onClick={requestCode} disabled={isPending || cooldown > 0}>{cooldown ? messages.resendCountdown.replace("{seconds}", String(cooldown)) : messages.resend}</Button></div>
            <div className="delete-project-dialog-actions"><Button type="button" variant="secondary" onClick={() => { setStage("request"); setCode(""); setNewPassword(""); setConfirmation(""); setError(undefined); }} disabled={isPending}>{messages.cancel}</Button><Button type="submit" disabled={isPending} aria-busy={isPending}>{isPending ? messages.updatingPassword : messages.updatePassword}</Button></div>
          </form>
        </>}
      </div>
    </dialog>
  </>;
}
