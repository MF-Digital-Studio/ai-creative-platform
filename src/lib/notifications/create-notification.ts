import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { NotificationType } from "@/lib/notifications/types";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  projectId: string;
  projectName: string;
  generationId: string;
};

export function getNotificationEventKey(type: NotificationType, generationId: string) {
  return `${type}:${generationId}`;
}

export async function createNotification(input: CreateNotificationInput): Promise<boolean> {
  const eventKey = getNotificationEventKey(input.type, input.generationId);
  try {
    const { error } = await getSupabaseAdminClient().from("notifications").upsert({
      user_id: input.userId,
      type: input.type,
      title: `notifications.${input.type}.title`,
      message: `notifications.${input.type}.message`,
      project_id: input.projectId,
      generation_id: input.generationId,
      event_key: eventKey,
      metadata: { project_name: input.projectName },
    }, { onConflict: "user_id,event_key", ignoreDuplicates: true });

    if (!error) return true;
    console.error("[notifications] create_failed", { eventKey, code: error.code });
    return false;
  } catch {
    console.error("[notifications] create_failed", { eventKey, code: "unavailable" });
    return false;
  }
}
