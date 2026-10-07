export const notificationTypes = [
  "generation_completed",
  "generation_failed",
  "image_edit_completed",
  "image_edit_failed",
] as const;

export type NotificationType = (typeof notificationTypes)[number];

export const maxVisibleNotifications = 5;

export type NotificationItem = {
  id: string;
  type: NotificationType;
  projectId: string | null;
  generationId: string | null;
  projectName: string | null;
  isRead: boolean;
  createdAt: string;
};

export function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === "string" && notificationTypes.includes(value as NotificationType);
}

export function getNotificationHref(locale: string, item: Pick<NotificationItem, "projectId" | "generationId">) {
  if (!item.projectId) return `/${locale}/dashboard`;
  const base = `/${locale}/dashboard/projects/${item.projectId}`;
  return item.generationId ? `${base}?generation=${encodeURIComponent(item.generationId)}` : base;
}

export function countUnreadNotifications(items: readonly Pick<NotificationItem, "isRead">[]) {
  return items.reduce((count, item) => count + (item.isRead ? 0 : 1), 0);
}

export function markNotificationReadInList(items: readonly NotificationItem[], notificationId: string) {
  return items.map((item) => item.id === notificationId ? { ...item, isRead: true } : item);
}

export function markAllNotificationsReadInList(items: readonly NotificationItem[]) {
  return items.map((item) => ({ ...item, isRead: true }));
}
