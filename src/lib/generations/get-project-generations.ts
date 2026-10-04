import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ImageGenerationQuality } from "@/lib/generation/types";

const generationFields = [
  "id",
  "project_id",
  "input_asset_id",
  "generation_type",
  "status",
  "provider",
  "model",
  "quality",
  "aspect_ratio",
  "preservation_mode",
  "fidelity_status",
  "fidelity_score",
  "creative_direction_snapshot",
  "output_bucket_id",
  "output_object_path",
  "error_message",
  "cost_usd",
  "output_mime_type",
  "processing_started_at",
  "processing_completed_at",
  "processing_duration_ms",
  "provider_metadata",
  "created_at",
  "updated_at",
].join(", ");

type GenerationType = "image" | "video";
type GenerationStatus = "queued" | "processing" | "succeeded" | "failed";

type ProjectGenerationRow = {
  id: string;
  project_id: string;
  input_asset_id: string | null;
  generation_type: GenerationType;
  status: GenerationStatus;
  provider: string;
  model: string;
  quality: ImageGenerationQuality | null;
  aspect_ratio: "1:1" | "4:5" | "3:4" | "16:9" | "9:16" | null;
  preservation_mode: "reference_edit" | "pixel_lock" | null;
  fidelity_status: "not_checked" | "locked" | "failed" | "not_available" | null;
  fidelity_score: number | null;
  creative_direction_snapshot: string;
  output_bucket_id: string | null;
  output_object_path: string | null;
  error_message: string | null;
  cost_usd: number | null;
  output_mime_type: string | null;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  processing_duration_ms: number | null;
  provider_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type ProjectGeneration = ProjectGenerationRow & {
  preview_url?: string;
};

export async function getProjectGenerations(
  userId: string,
  projectId: string,
): Promise<ProjectGeneration[]> {
  if (!userId) {
    throw new Error("Unable to load project generations.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generations")
    .select(generationFields)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    throw new Error("Unable to load project generations.");
  }

  const generations = (data ?? []) as unknown as ProjectGenerationRow[];

  const staleBefore = Date.now() - 10 * 60 * 1000;
  for (const generation of generations) {
    if (generation.status !== "queued" || new Date(generation.created_at).getTime() >= staleBefore) continue;
    const { data: stalled } = await getSupabaseAdminClient().from("generations")
      .update({ status: "failed", error_message: "queue_stalled", processing_completed_at: new Date().toISOString() })
      .eq("id", generation.id).eq("project_id", projectId).eq("status", "queued")
      .select("id").maybeSingle();
    if (stalled) {
      generation.status = "failed";
      generation.error_message = "queue_stalled";
      console.info("[generation-queue] status_transition", { generationId: generation.id, from: "queued", to: "failed" });
    }
  }

  return Promise.all(
    generations.map(async (generation) => {
      if (
        generation.generation_type !== "image" ||
        generation.status !== "succeeded" ||
        !generation.output_bucket_id ||
        !generation.output_object_path
      ) {
        return generation;
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(generation.output_bucket_id)
        .createSignedUrl(generation.output_object_path, 3600);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        return generation;
      }

      return { ...generation, preview_url: signedUrlData.signedUrl };
    }),
  );
}
