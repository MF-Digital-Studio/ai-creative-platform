import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { runQueuedImageGeneration } from "@/app/[locale]/dashboard/projects/[projectId]/generation-actions";
import { RunGenerationButton } from "./run-generation-button";
import { ProjectGenerationWorkspace } from "@/components/projects/project-generation-workspace";
import type { GenerationGalleryItem } from "@/components/projects/generation-gallery";
import { ProjectControlPanel } from "@/components/projects/project-control-panel";
import { createImageEdit } from "@/app/[locale]/dashboard/projects/[projectId]/generation-actions";
import { ProjectHeader } from "@/components/projects/project-header";
import { isSupportedLocale } from "@/i18n/routing";
import { getProjectProductAsset } from "@/lib/assets/get-project-product-asset";
import { getProjectReferenceAssets } from "@/lib/assets/reference-assets";
import { getAuthenticatedUserId } from "@/lib/auth/require-user";
import { getProjectGenerations } from "@/lib/generations/get-project-generations";
import { getProject } from "@/lib/projects/get-project";
import { createClient } from "@/lib/supabase/server";

type ProjectPageProps = { params: Promise<{ locale: string; projectId: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Dashboard.project" });
  return { title: t("metadataTitle"), description: t("metadataDescription") };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { locale, projectId } = await params;
  if (!isSupportedLocale(locale) || !uuidPattern.test(projectId)) notFound();
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new Error("Unable to load project.");

  const [project, t] = await Promise.all([getProject(userId, projectId), getTranslations({ locale, namespace: "Dashboard.project" })]);
  if (!project) notFound();
  const [productAsset, referenceAssets, generations] = await Promise.all([
    getProjectProductAsset(userId, projectId), getProjectReferenceAssets(userId, projectId), getProjectGenerations(userId, projectId),
  ]);
  const supabase = await createClient();
  let initialAsset: { objectPath: string; signedUrl: string } | null = null;
  if (productAsset) {
    const { data, error } = await supabase.storage.from("product-assets").createSignedUrl(productAsset.object_path, 3600);
    if (error || !data?.signedUrl) throw new Error("Unable to load product asset preview.");
    initialAsset = { objectPath: productAsset.object_path, signedUrl: data.signedUrl };
  }
  const referenceUrls = (await Promise.all(referenceAssets.map(async (reference) => {
    const { data } = await supabase.storage.from("product-assets").createSignedUrl(reference.object_path, 3600);
    return data?.signedUrl ?? null;
  }))).filter((url): url is string => Boolean(url));

  setRequestLocale(locale);
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const costFormatter = new Intl.NumberFormat(locale, { style: "currency", currency: "USD" });
  const items: GenerationGalleryItem[] = generations.map((generation, index) => ({
    id: generation.id,
    previewUrl: generation.preview_url ?? null,
    alt: `${t("outputs.previewAlt")} ${index + 1}`,
    typeLabel: t(`outputs.types.${generation.generation_type}`),
    status: generation.status,
    statusLabel: t(`outputs.status.${generation.status}`),
    createdAt: dateFormatter.format(new Date(generation.created_at)),
    createdDateTime: generation.created_at,
    provider: generation.provider,
    model: generation.model,
    cost: generation.cost_usd === null ? null : costFormatter.format(generation.cost_usd),
    direction: generation.creative_direction_snapshot,
  }));
  const runActions = generations.filter((generation) => generation.generation_type === "image" && generation.status === "queued").map((generation) => ({
    id: generation.id,
    node: <RunGenerationButton key={generation.id} action={runQueuedImageGeneration.bind(null, project.id, generation.id)} messages={{
      run: t("generation.run"), running: t("generation.running"), generationFailed: t("generation.generationFailed"), notQueued: t("generation.notQueued"),
    }} />,
  }));

  return <main className="dashboard-main"><div className="dashboard-main-inner dashboard-container project-page-shell">
    <ProjectHeader project={project} locale={locale} />
    <ProjectGenerationWorkspace items={items} runActions={runActions} controls={<ProjectControlPanel locale={locale} projectId={project.id} userId={userId} hasOutput={items.some((item) => item.previewUrl !== null)} initialAsset={initialAsset} referenceUrls={referenceUrls} />} editAction={createImageEdit.bind(null, locale, project.id)} hasOutput={items.some((item) => item.previewUrl !== null)} editMessages={{ title: t("imageEdit.title"), description: t("imageEdit.description"), placeholder: t("imageEdit.placeholder"), helper: t("imageEdit.helper"), apply: t("imageEdit.apply"), unavailable: t("imageEdit.unavailable"), failed: t("imageEdit.failed"), progressTitle: t("imageEdit.progressTitle"), progressDescription: t("imageEdit.progressDescription"), progressStatuses: [t("imageEdit.progressStatuses.applying"), t("imageEdit.progressStatuses.preserving"), t("imageEdit.progressStatuses.checking"), t("imageEdit.progressStatuses.finalizing")] }} messages={{
      openFullscreen: t("outputs.openFullscreen"), closeFullscreen: t("outputs.closeFullscreen"), zoomImage: t("outputs.zoomImage"), zoomOutImage: t("outputs.zoomOutImage"), resetImageZoom: t("outputs.resetImageZoom"), galleryLabel: t("outputs.galleryLabel"), selectOutput: t("outputs.selectOutput"), details: t("outputs.details"), status: t("outputs.statusLabel"), advancedDetails: t("outputs.advancedDetails"), direction: t("outputs.direction"), provider: t("outputs.provider"), model: t("outputs.model"), created: t("outputs.created"), cost: t("outputs.cost"), emptyHeading: t("outputs.emptyHeading"), emptyDescription: t("outputs.emptyDescription"), noPreview: t("outputs.noPreview"), noPreviewDescription: t("outputs.noPreviewDescription"), goToControls: t("outputs.goToControls"), failedHeading: t("outputs.failedHeading"), failedDescription: t("outputs.failedDescription"), processingHeading: t("outputs.processingHeading"), processingDescription: t("outputs.processingDescription"), queuedHeading: t("outputs.queuedHeading"), queuedDescription: t("outputs.queuedDescription"), historyHeading: t("outputs.historyHeading"),
    }} />
  </div></main>;
}
