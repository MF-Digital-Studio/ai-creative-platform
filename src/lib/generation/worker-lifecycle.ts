import "server-only";

import { createNotification } from "@/lib/notifications/create-notification";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function prepareGenerationRetry(generationId: string) {
  await getSupabaseAdminClient().from("generations").update({ status: "queued", error_message: null, processing_started_at: null, processing_completed_at: null, processing_duration_ms: null }).eq("id", generationId).eq("status", "failed");
}

export async function finalizeGenerationFailure(generationId: string, failureCategory: string) {
  const admin = getSupabaseAdminClient();
  const { data: generation } = await admin.from("generations")
    .update({ status: "failed", error_message: failureCategory, processing_completed_at: new Date().toISOString() })
    .eq("id", generationId).in("status", ["queued", "processing"])
    .select("id, project_id").maybeSingle();
  if (!generation) return;
  const { data: project } = await admin.from("projects").select("user_id, title").eq("id", generation.project_id).maybeSingle();
  if (!project) return;
  try {
    await createNotification({ userId: project.user_id, type: "generation_failed", projectId: generation.project_id, projectName: project.title, generationId });
  } catch (error) {
    console.warn("[generation] failure_notification_failed", { generationId, reason: error instanceof Error ? error.name : "notification_error" });
  }
}

/**
 * Used when dispatch never acquired the queued job. It deliberately cannot
 * transition `processing`, so a duplicate dispatcher cannot fail another
 * worker that already holds the claim.
 */
export async function finalizeQueuedGenerationFailure(generationId: string, failureCategory: string) {
  const admin = getSupabaseAdminClient();
  const { data: generation, error } = await admin.from("generations")
    .update({ status: "failed", error_message: failureCategory, processing_completed_at: new Date().toISOString() })
    .eq("id", generationId).eq("status", "queued")
    .select("id, project_id").maybeSingle();
  if (error || !generation) return false;
  const { data: project } = await admin.from("projects").select("user_id, title").eq("id", generation.project_id).maybeSingle();
  if (!project) return true;
  try {
    await createNotification({ userId: project.user_id, type: "generation_failed", projectId: generation.project_id, projectName: project.title, generationId });
  } catch (notificationError) {
    console.warn("[generation] failure_notification_failed", { generationId, reason: notificationError instanceof Error ? notificationError.name : "notification_error" });
  }
  return true;
}
