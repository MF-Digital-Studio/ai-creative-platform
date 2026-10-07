import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { setRequestLocale } from "next-intl/server";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isSupportedLocale } from "@/i18n/routing";
import { getAuthenticatedUserId } from "@/lib/auth/require-user";
import { getOrCreateProfile } from "@/lib/profile/get-or-create-profile";
import { getRecentNotifications } from "@/lib/notifications/get-notifications";
import type { NotificationItem } from "@/lib/notifications/types";

type DashboardLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  await connection();

  const userId = await getAuthenticatedUserId();

  if (!userId) {
    redirect(`/${locale}/login`);
  }

  const profile = await getOrCreateProfile(userId);
  let notifications: NotificationItem[] = [];
  let notificationsRenderedAt = 0;
  let notificationsLoadFailed = false;
  try {
    const snapshot = await getRecentNotifications(userId);
    notifications = snapshot.items;
    notificationsRenderedAt = snapshot.renderedAt;
  } catch {
    notificationsLoadFailed = true;
  }

  setRequestLocale(locale);
  return <DashboardShell displayName={profile.display_name} notifications={notifications} notificationsRenderedAt={notificationsRenderedAt} notificationsLoadFailed={notificationsLoadFailed}>{children}</DashboardShell>;
}
