import { getTranslations } from "next-intl/server";
import type { GenerationStatus, ProjectStatus } from "@/lib/projects/get-projects";

export async function StatusBadge({ status, kind = "generation" }: { status: GenerationStatus | ProjectStatus; kind?: "generation" | "project" }) {
  const t = await getTranslations("Dashboard.recentWork");
  const label = kind === "generation" ? t(`generationStatus.${status as GenerationStatus}`) : t(`status.${status as ProjectStatus}`);
  return <span className="dashboard-status" data-status={status}><span aria-hidden="true" />{label}</span>;
}
