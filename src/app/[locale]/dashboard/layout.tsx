import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";

type DashboardLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Pick<DashboardLayoutProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardShell>{children}</DashboardShell>;
}
