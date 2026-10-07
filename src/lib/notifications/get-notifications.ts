import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isNotificationType, maxVisibleNotifications, type NotificationItem } from "@/lib/notifications/types";

type NotificationRow = {
  id: string;
  type: string;
  project_id: string | null;
  generation_id: string | null;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

export async function getRecentNotifications(userId: string): Promise<{ items: NotificationItem[]; renderedAt: number }> {
  const { data, error } = await (await createClient()).from("notifications")
    .select("id,type,project_id,generation_id,is_read,created_at,metadata")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(maxVisibleNotifications);

  if (error) throw new Error("Unable to load notifications.");

  const items = ((data ?? []) as NotificationRow[]).flatMap((row) => {
    if (!isNotificationType(row.type)) return [];
    const projectName = typeof row.metadata?.project_name === "string" ? row.metadata.project_name : null;
    return [{ id: row.id, type: row.type, projectId: row.project_id, generationId: row.generation_id, projectName, isRead: row.is_read, createdAt: row.created_at }];
  });
  return { items, renderedAt: Date.now() };
}
