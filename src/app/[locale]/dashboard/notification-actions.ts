"use server";

import { getAuthenticatedUserId } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function markNotificationRead(notificationId: string) {
  if (!uuidPattern.test(notificationId)) return false;
  const userId = await getAuthenticatedUserId();
  if (!userId) return false;
  const { error } = await (await createClient()).from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);
  return !error;
}

export async function markAllNotificationsRead() {
  const userId = await getAuthenticatedUserId();
  if (!userId) return false;
  const { error } = await (await createClient()).from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return !error;
}
