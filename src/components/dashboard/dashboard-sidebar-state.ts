export function resolveDashboardSidebarCollapsed(savedPreference: string | null, tabletViewport: boolean) {
  if (savedPreference === "true") return true;
  if (savedPreference === "false") return false;
  return tabletViewport;
}
