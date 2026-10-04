export const navigationItems = [
  { key: "home", href: "/", activePath: "/" },
  { key: "howItWorks", href: "/#how-it-works" },
  { key: "showcase", href: "/#examples" },
] as const;

export const navbarNavigationItems = [
  navigationItems[0],
  navigationItems[1],
  navigationItems[2],
] as const;
