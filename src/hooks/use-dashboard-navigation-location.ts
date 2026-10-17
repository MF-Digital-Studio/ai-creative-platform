"use client";

import { useSyncExternalStore } from "react";

import {
  isDashboardNavigationItemActive,
  type DashboardNavigationItem,
} from "@/data/dashboard-navigation";
import { usePathname } from "@/i18n/navigation";

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function getHash() {
  return window.location.hash;
}

export function useDashboardNavigationLocation() {
  const pathname = usePathname();
  const hash = useSyncExternalStore(subscribeToHash, getHash, () => "");

  function isActive(item: DashboardNavigationItem) {
    return isDashboardNavigationItemActive(item, pathname, hash);
  }

  return { hash, isActive, pathname };
}
