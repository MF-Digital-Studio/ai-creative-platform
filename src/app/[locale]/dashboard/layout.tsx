import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isSupportedLocale } from "@/i18n/routing";
import { getAuthenticatedUserId } from "@/lib/auth/require-user";
import { getOrCreateProfile } from "@/lib/profile/get-or-create-profile";

type DashboardLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    redirect(`/${locale}/login`);
  }

  await getOrCreateProfile(userId);

  setRequestLocale(locale);
  return <DashboardShell>{children}</DashboardShell>;
}
