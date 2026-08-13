import "server-only";

import { createClient } from "@/lib/supabase/server";

const generationFields = [
  "id",
  "project_id",
  "input_asset_id",
  "generation_type",
  "status",
  "provider",
  "model",
  "creative_direction_snapshot",
  "output_bucket_id",
  "output_object_path",
  "error_message",
  "cost_usd",
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
  creative_direction_snapshot: string;
  output_bucket_id: string | null;
  output_object_path: string | null;
  error_message: string | null;
  cost_usd: number | null;
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
