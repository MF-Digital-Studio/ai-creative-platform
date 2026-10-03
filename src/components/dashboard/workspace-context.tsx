"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";

export function WorkspaceContext() {
  const t = useTranslations("Dashboard.navigation");
  const pathname = usePathname();
  const label = pathname === "/dashboard/account" ? t("items.account") : pathname.startsWith("/dashboard/projects") ? t("items.projects") : t("items.home");
  return <span>{label}</span>;
}
