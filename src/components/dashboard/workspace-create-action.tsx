"use client";

import {DashboardIcon} from "@/components/dashboard/dashboard-icons";
import {Link, usePathname} from "@/i18n/navigation";

export function WorkspaceCreateAction({label}: {label: string}) {
  const pathname = usePathname();
  if (pathname === "/dashboard/projects") return null;
  return <Link href="/dashboard#composer" className="dashboard-topbar-create" aria-label={label}><DashboardIcon name="plus" /><span className="dashboard-topbar-create-label">{label}</span></Link>;
}
