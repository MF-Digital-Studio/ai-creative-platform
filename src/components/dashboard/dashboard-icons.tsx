import type { SVGProps } from "react";

import type { DashboardIconName } from "@/data/dashboard-navigation";

type DashboardIconProps = SVGProps<SVGSVGElement> & {
  name: DashboardIconName | "menu" | "close" | "plus" | "arrow" | "collapse" | "expand" | "website" | "chevron";
};

export function DashboardIcon({ name, ...props }: DashboardIconProps) {
  const commonProps = {
    "aria-hidden": true,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.6,
    ...props,
  };

  switch (name) {
    case "home":
      return <svg {...commonProps}><path d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9Z" /></svg>;
    case "spark":
      return <svg {...commonProps}><path d="m12 3 1.25 4.1a5.3 5.3 0 0 0 3.65 3.65L21 12l-4.1 1.25a5.3 5.3 0 0 0-3.65 3.65L12 21l-1.25-4.1a5.3 5.3 0 0 0-3.65-3.65L3 12l4.1-1.25a5.3 5.3 0 0 0 3.65-3.65L12 3Z" /></svg>;
    case "projects":
      return <svg {...commonProps}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 5v14M8 9h12" /></svg>;
    case "templates":
      return <svg {...commonProps}><rect x="4" y="4" width="6" height="7" rx="1" /><rect x="14" y="4" width="6" height="4" rx="1" /><rect x="4" y="15" width="6" height="5" rx="1" /><rect x="14" y="12" width="6" height="8" rx="1" /></svg>;
    case "assets":
      return <svg {...commonProps}><rect x="4" y="4" width="16" height="16" rx="2" /><circle cx="9" cy="9" r="1.5" /><path d="m6.5 17 4-4 2.75 2.75 1.75-2 2.5 3.25" /></svg>;
    case "usage":
      return <svg {...commonProps}><path d="M5 19V9M12 19V5M19 19v-7" /></svg>;
    case "settings":
      return <svg {...commonProps}><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.55-2-3.5-2.45 1a7 7 0 0 0-2.05-1.2L14 3h-4l-.4 2.55a7 7 0 0 0-2.05 1.2l-2.45-1-2 3.5 2 1.55A7 7 0 0 0 5 12c0 .4.03.8.1 1.2l-2 1.55 2 3.5 2.45-1a7 7 0 0 0 2.05 1.2L10 21h4l.4-2.55a7 7 0 0 0 2.05-1.2l2.45 1 2-3.5-2-1.55c.07-.4.1-.8.1-1.2Z" /></svg>;
    case "upgrade":
      return <svg {...commonProps}><path d="M12 20V5M6 11l6-6 6 6" /></svg>;
    case "account":
      return <svg {...commonProps}><circle cx="12" cy="8" r="3" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></svg>;
    case "menu":
      return <svg {...commonProps}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    case "close":
      return <svg {...commonProps}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "plus":
      return <svg {...commonProps}><path d="M12 5v14M5 12h14" /></svg>;
    case "arrow":
      return <svg {...commonProps}><path d="M5 12h14M14 7l5 5-5 5" /></svg>;
    case "collapse":
      return <svg {...commonProps}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16m7-11-3 3 3 3" /></svg>;
    case "expand":
      return <svg {...commonProps}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16m4-11 3 3-3 3" /></svg>;
    case "website":
      return <svg {...commonProps}><path d="M13 5h6v6m0-6-9 9" /><path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" /></svg>;
    case "chevron":
      return <svg {...commonProps}><path d="m6 9 6 6 6-6" /></svg>;
  }
}
