export const navigationItems = [
  { key: "home", href: "/", activePath: "/" },
  { key: "howItWorks", href: "/#how-it-works" },
  { key: "templates", href: "/#templates" },
  { key: "showcase", href: "/showcase", activePath: "/showcase" },
  { key: "pricing", href: "/#pricing" },
] as const;

export const navbarNavigationItems = [
  navigationItems[0],
  navigationItems[3],
] as const;
