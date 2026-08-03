import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isSupportedLocale } from "@/i18n/routing";

type DashboardLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  return <DashboardShell>{children}</DashboardShell>;
}
