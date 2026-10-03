import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { GenerationStatus } from "@/lib/projects/get-projects";

export type DashboardGeneration = {
  id: string;
  projectId: string;
  projectTitle: string | null;
  status: GenerationStatus;
  type: "image" | "video";
  createdAt: string;
  previewUrl: string | null;
};

export async function getDashboardGenerations(userId: string) {
  const supabase = await createClient();
  const { data: ownedProjects, error: projectError } = await supabase.from("projects").select("id, title").eq("user_id", userId);
  if (projectError) throw new Error("Unable to load dashboard projects.");
  const projects = ownedProjects ?? [];
  if (projects.length === 0) return { projectCount: 0, completedCount: 0, activeCount: 0, generations: [] as DashboardGeneration[] };

  const projectIds = projects.map((project) => project.id);
  const [{ data: rows, error }, { count: completedCount, error: completedError }, { count: queuedCount, error: queuedError }, { count: processingCount, error: processingError }] = await Promise.all([
    supabase.from("generations").select("id, project_id, generation_type, status, created_at, output_bucket_id, output_object_path").in("project_id", projectIds).order("created_at", { ascending: false }).limit(6),
    supabase.from("generations").select("id", { count: "exact", head: true }).in("project_id", projectIds).eq("status", "succeeded"),
    supabase.from("generations").select("id", { count: "exact", head: true }).in("project_id", projectIds).eq("status", "queued"),
    supabase.from("generations").select("id", { count: "exact", head: true }).in("project_id", projectIds).eq("status", "processing"),
  ]);
  if (error || completedError || queuedError || processingError) throw new Error("Unable to load dashboard generations.");
  const titleById = new Map(projects.map((project) => [project.id, project.title]));
  const generations = await Promise.all((rows ?? []).map(async (row) => {
    let previewUrl: string | null = null;
    if (row.generation_type === "image" && row.status === "succeeded" && row.output_bucket_id && row.output_object_path) {
      const { data } = await supabase.storage.from(row.output_bucket_id).createSignedUrl(row.output_object_path, 3600);
      previewUrl = data?.signedUrl ?? null;
    }
    return { id: row.id, projectId: row.project_id, projectTitle: titleById.get(row.project_id) ?? null, status: row.status as GenerationStatus, type: row.generation_type as "image" | "video", createdAt: row.created_at, previewUrl };
  }));
  return { projectCount: projects.length, completedCount: completedCount ?? 0, activeCount: (queuedCount ?? 0) + (processingCount ?? 0), generations };
}
