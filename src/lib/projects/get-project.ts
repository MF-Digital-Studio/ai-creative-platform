import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Project } from "./get-projects";

const projectFields = "id, title, status, creative_direction, created_at, updated_at";

export type ProjectDetail = Project & {
  creative_direction: string | null;
};

export async function getProject(userId: string, projectId: string): Promise<ProjectDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(projectFields)
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load project.");
  }

  return data as ProjectDetail | null;
}
