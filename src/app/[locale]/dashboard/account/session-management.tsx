"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { signOutWithScope } from "@/lib/auth/session-sign-out";

type Action = "others" | "global";
type Messages = {
  sessions: string; currentSession: string; activeNow: string; current: string;
  signOutDevice: string; signingOut: string; signOutOthers: string; signOutOthersDescription: string;
  signingOutOthers: string; signOutEverywhere: string; signingOutEverywhere: string;
  othersTitle: string; othersBody: string; confirmOthers: string; globalTitle: string;
  globalBody: string; confirmGlobal: string; cancel: string; error: string;
  localDescription: string; dangerZone: string; globalDescription: string;
};

type SessionManagementProps = { signInHref: string; messages: Messages };

function getDeviceLabel(): string {
  const ua = navigator.userAgent;
  const platform = navigator.platform || "";
  let browser = "";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/CriOS\//.test(ua)) browser = "Chrome";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua)) browser = "Safari";

  let os = "";
  if (/iPhone|iPad|iPod/.test(ua)) os = "iPhone";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Windows/.test(platform) || /Windows/.test(ua)) os = "Windows";
  else if (/Mac/.test(platform) || /Mac OS/.test(ua)) os = "macOS";
  else if (/Linux/.test(platform) || /Linux/.test(ua)) os = "Linux";
  return [browser, os].filter(Boolean).join(" · ");
}

export function SessionManagement({ signInHref, messages }: SessionManagementProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const device = useSyncExternalStore(() => () => {}, getDeviceLabel, () => "");
  const [action, setAction] = useState<Action>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (action && !pending) cancelRef.current?.focus();
  }, [action, pending]);

  function openConfirmation(nextAction: Action) {
    setError(false);
    setAction(nextAction);
    requestAnimationFrame(() => dialogRef.current?.showModal());
  }

  function closeConfirmation() {
    if (pending) return;
    dialogRef.current?.close();
    setAction(undefined);
  }

  async function signOut(scope: "local" | "others" | "global") {
    if (pending) return;
    setPending(true);
    setError(false);
    try {
      const { error: signOutError } = await signOutWithScope(createClient().auth, scope);
      if (signOutError) {
        setError(true);
        return;
      }
      if (scope === "others") {
        dialogRef.current?.close();
        setAction(undefined);
        return;
      }
      window.location.assign(signInHref);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  const title = action === "global" ? messages.globalTitle : messages.othersTitle;
  const description = action === "global" ? messages.globalBody : messages.othersBody;
  const confirm = action === "global" ? messages.confirmGlobal : messages.confirmOthers;

  return <div className="session-management">
    <div className="session-current">
      <div className="session-current-copy">
        <span className="session-current-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></svg></span>
        <div><h3>{device || messages.currentSession}</h3><p>{messages.activeNow}</p></div>
      </div>
      <span className="session-current-badge">{messages.current}</span>
    </div>
    <div className="session-actions-grid">
      <div className="session-action-row">
        <div><h3>{messages.signOutOthers}</h3><p>{messages.signOutOthersDescription}</p></div>
        <Button type="button" variant="secondary" size="sm" onClick={() => openConfirmation("others")} disabled={pending}>{messages.signOutOthers}</Button>
      </div>
      <div className="session-action-row session-local-action">
        <div><h3>{messages.signOutDevice}</h3><p>{messages.localDescription}</p></div>
        <Button type="button" variant="ghost" size="sm" onClick={() => void signOut("local")} disabled={pending} aria-busy={pending}>{pending ? messages.signingOut : messages.signOutDevice}</Button>
      </div>
    </div>
    <div className="session-danger-zone">
      <div><span>{messages.dangerZone}</span><h3>{messages.signOutEverywhere}</h3><p>{messages.globalDescription}</p></div>
      <Button type="button" variant="secondary" size="sm" onClick={() => openConfirmation("global")} disabled={pending} className="session-danger-trigger">{messages.signOutEverywhere}</Button>
    </div>
    {error ? <p className="session-error" role="alert">{messages.error}</p> : null}
    <dialog ref={dialogRef} className="delete-project-dialog session-confirm-dialog" aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={(event) => { if (pending) event.preventDefault(); else setAction(undefined); }} onClose={() => { if (!pending) setAction(undefined); }} onClick={(event) => { if (event.target === event.currentTarget) closeConfirmation(); }}>
      <div className="delete-project-dialog-content">
        <h2 id={titleId}>{title}</h2><p id={descriptionId}>{description}</p>
        {error ? <p role="alert">{messages.error}</p> : null}
        <div className="delete-project-dialog-actions">
          <Button ref={cancelRef} type="button" variant="secondary" onClick={closeConfirmation} disabled={pending}>{messages.cancel}</Button>
          <Button type="button" onClick={() => void signOut(action === "global" ? "global" : "others")} disabled={pending} aria-busy={pending} className={action === "global" ? "session-destructive-button" : undefined}>{pending ? action === "global" ? messages.signingOutEverywhere : messages.signingOutOthers : confirm}</Button>
        </div>
      </div>
    </dialog>
  </div>;
}
