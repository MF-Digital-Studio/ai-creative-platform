export type DashboardNavigationId =
  | "home"
  | "projects"
  | "create"
  | "files"
  | "usage"
  | "settings";

export type DashboardIconName =
  | "home"
  | "projects"
  | "spark"
  | "files"
  | "credits"
  | "settings";

export type DashboardNavigationItem = {
  id: DashboardNavigationId;
  labelKey: `navigation.${DashboardNavigationId}`;
  href: `/dashboard${"" | "/projects" | "/create" | "/files" | "/usage" | "/settings"}`;
  icon: DashboardIconName;
  exact: boolean;
};

export const dashboardNavigation: readonly DashboardNavigationItem[] = [
  {
    id: "home",
    labelKey: "navigation.home",
    href: "/dashboard",
    icon: "home",
    exact: true,
  },
  {
    id: "projects",
    labelKey: "navigation.projects",
    href: "/dashboard/projects",
    icon: "projects",
    exact: false,
  },
  {
    id: "create",
    labelKey: "navigation.create",
    href: "/dashboard/create",
    icon: "spark",
    exact: false,
  },
  {
    id: "files",
    labelKey: "navigation.files",
    href: "/dashboard/files",
    icon: "files",
    exact: false,
  },
  {
    id: "usage",
    labelKey: "navigation.usage",
    href: "/dashboard/usage",
    icon: "credits",
    exact: false,
  },
  {
    id: "settings",
    labelKey: "navigation.settings",
    href: "/dashboard/settings",
    icon: "settings",
    exact: false,
  },
];

export function isDashboardNavigationItemActive(
  pathname: string,
  item: DashboardNavigationItem,
) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}
