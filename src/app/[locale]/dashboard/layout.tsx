import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isSupportedLocale } from "@/i18n/routing";
import { hasAuthenticatedUser } from "@/lib/auth/require-user";

type DashboardLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const isAuthenticated = await hasAuthenticatedUser();

  if (!isAuthenticated) {
    redirect(`/${locale}/login`);
  }

  setRequestLocale(locale);
  return <DashboardShell>{children}</DashboardShell>;
}
