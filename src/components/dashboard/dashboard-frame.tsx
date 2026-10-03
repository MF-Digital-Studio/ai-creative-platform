"use client";

import { useSyncExternalStore } from "react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

const storageKey = "klay-dashboard-sidebar-collapsed";
const sidebarChangeEvent = "klay-dashboard-sidebar-change";

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(max-width: 1100px)");
  window.addEventListener("storage", onChange);
  window.addEventListener(sidebarChangeEvent, onChange);
  media.addEventListener("change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(sidebarChangeEvent, onChange);
    media.removeEventListener("change", onChange);
  };
}

function getCollapsed() {
  const saved = window.localStorage.getItem(storageKey);
  return saved === null ? window.matchMedia("(max-width: 1100px)").matches : saved === "true";
}

export function DashboardFrame({ children, topbar, displayName }: { children: React.ReactNode; topbar: React.ReactNode; displayName?: string | null }) {
  const collapsed = useSyncExternalStore(subscribe, getCollapsed, () => false);

  function toggleSidebar() {
    window.localStorage.setItem(storageKey, String(!collapsed));
    window.dispatchEvent(new Event(sidebarChangeEvent));
  }

  return <div className="dashboard-shell" data-collapsed={collapsed || undefined}>
    <DashboardSidebar displayName={displayName} collapsed={collapsed} onToggle={toggleSidebar} />
    <div className="dashboard-workspace-shell">{topbar}{children}</div>
  </div>;
}
