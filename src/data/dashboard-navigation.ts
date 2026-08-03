export type DashboardIconName =
  | "home"
  | "spark"
  | "projects"
  | "templates"
  | "assets"
  | "usage"
  | "settings"
  | "upgrade"
  | "account";

export type DashboardNavigationItem = {
  key: string;
  icon: DashboardIconName;
  href: string | null;
};

export const dashboardPrimaryNavigation: DashboardNavigationItem[] = [
  { key: "home", icon: "home", href: "/dashboard" },
  { key: "create", icon: "spark", href: "/dashboard#composer" },
  { key: "projects", icon: "projects", href: "/dashboard#recent-work" },
  { key: "templates", icon: "templates", href: "/dashboard#templates" },
  { key: "assets", icon: "assets", href: "/dashboard#inspiration" },
];

export const dashboardUtilityNavigation: DashboardNavigationItem[] = [
  { key: "usage", icon: "usage", href: null },
  { key: "settings", icon: "settings", href: null },
];

export const dashboardFooterNavigation: DashboardNavigationItem[] = [
  { key: "upgrade", icon: "upgrade", href: "/#pricing" },
  { key: "account", icon: "account", href: null },
];
