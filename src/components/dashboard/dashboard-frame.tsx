"use client";

import { useEffect, useSyncExternalStore } from "react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

const storageKey = "klay-dashboard-sidebar-collapsed";
const sidebarChangeEvent = "klay-dashboard-sidebar-change";

function subscribe(onChange: () => void) {
  const media = window.matchMedia("(min-width: 768px) and (max-width: 1199px)");
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
  return window.matchMedia("(min-width: 768px) and (max-width: 1199px)").matches || saved === "true";
}

export function DashboardFrame({ children, topbar, displayName }: { children: React.ReactNode; topbar: React.ReactNode; displayName?: string | null }) {
  const collapsed = useSyncExternalStore(subscribe, getCollapsed, () => false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    function checkHorizontalOverflow() {
      const page = document.documentElement;
      if (page.scrollWidth > page.clientWidth) {
        console.warn(`Dashboard horizontal overflow at ${page.clientWidth}px: ${page.scrollWidth}px scroll width`);
      }
    }

    checkHorizontalOverflow();
    window.addEventListener("resize", checkHorizontalOverflow);
    return () => window.removeEventListener("resize", checkHorizontalOverflow);
  }, []);

  function toggleSidebar() {
    window.localStorage.setItem(storageKey, String(!collapsed));
    window.dispatchEvent(new Event(sidebarChangeEvent));
  }

  return <div className="dashboard-shell" data-collapsed={collapsed || undefined}>
    <DashboardSidebar displayName={displayName} collapsed={collapsed} onToggle={toggleSidebar} />
    <div className="dashboard-workspace-shell">{topbar}{children}</div>
  </div>;
}
