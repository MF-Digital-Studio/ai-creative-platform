import type {ReactNode} from "react";

import {DashboardIcon} from "@/components/dashboard/dashboard-icons";
import {cn} from "@/lib/cn";

type AppStateProps = {
  code?: string;
  title: string;
  description: string;
  icon?: "projects" | "assets" | "spark" | "search" | "warning";
  actions?: ReactNode;
  compact?: boolean;
  role?: "alert" | "status";
  className?: string;
};

function StateIcon({name}: {name: NonNullable<AppStateProps["icon"]>}) {
  if (name === "search") return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4 4"/></svg>;
  if (name === "warning") return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v4m0 3h.01"/></svg>;
  return <DashboardIcon name={name} />;
}

export function AppState({code, title, description, icon = "assets", actions, compact = false, role, className}: AppStateProps) {
  return <section className={cn("app-state", compact && "app-state-compact", className)} role={role}>
    <div className="app-state-icon" aria-hidden="true"><StateIcon name={icon} /></div>
    {code ? <p className="app-state-code">{code}</p> : null}
    <h1>{title}</h1>
    <p>{description}</p>
    {actions ? <div className="app-state-actions">{actions}</div> : null}
  </section>;
}

