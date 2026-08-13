import "server-only";

import {createClient} from "@/lib/supabase/server";

const projectFields = "id, title, status, created_at, updated_at";

export type ProjectStatus = "draft" | "active" | "completed";

export type Project = {
  id: string;
  title: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
};

export async function getProjects(userId: string): Promise<Project[]> {
  const supabase = await createClient();
  const {data, error} = await supabase
    .from("projects")
    .select(projectFields)
    .eq("user_id", userId)
    .order("created_at", {ascending: false})
    .limit(6);

  if (error) {
    throw new Error("Unable to load projects.");
  }

  return (data ?? []) as Project[];
}
