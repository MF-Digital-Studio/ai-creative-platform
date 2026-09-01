import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  createQueuedImageGeneration,
  registerProductAsset,
  runQueuedImageGeneration,
} from "@/app/[locale]/dashboard/projects/[projectId]/actions";
import {
  GenerationGallery,
  type GenerationGalleryItem,
} from "@/components/projects/generation-gallery";
import { ProductImageUpload } from "@/components/projects/product-image-upload";
import { Link } from "@/i18n/navigation";
import { isSupportedLocale } from "@/i18n/routing";
import { getProjectProductAsset } from "@/lib/assets/get-project-product-asset";
import { getProjectReferenceAssets } from "@/lib/assets/reference-assets";
import { getAuthenticatedUserId } from "@/lib/auth/require-user";
import { getProjectGenerations } from "@/lib/generations/get-project-generations";
import { getProject } from "@/lib/projects/get-project";
import { createClient } from "@/lib/supabase/server";

import { CreativeDirectionForm } from "./creative-direction-form";
import { GenerateImageForm } from "./generate-image-form";
import { RunGenerationButton } from "./run-generation-button";

type ProjectPageProps = {
  params: Promise<{ locale: string; projectId: string }>;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "Dashboard.project" });
  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { locale, projectId } = await params;
  if (!isSupportedLocale(locale) || !uuidPattern.test(projectId)) {
    notFound();
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error("Unable to load project.");
  }

  const [project, t] = await Promise.all([
    getProject(userId, projectId),
    getTranslations({ locale, namespace: "Dashboard.project" }),
  ]);

  if (!project) {
    notFound();
  }

  const [persistedAsset, persistedReferences, generations] = await Promise.all([
    getProjectProductAsset(userId, projectId),
    getProjectReferenceAssets(userId, projectId),
    getProjectGenerations(userId, projectId),
  ]);
  let initialAsset: { objectPath: string; signedUrl: string } | null = null;

  if (persistedAsset) {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from("product-assets")
      .createSignedUrl(persistedAsset.object_path, 3600);

    if (error || !data?.signedUrl) {
      throw new Error("Unable to load product asset preview.");
    }

    initialAsset = {
      objectPath: persistedAsset.object_path,
      signedUrl: data.signedUrl,
    };
  }

  const referencePreviewUrls = persistedReferences.length
    ? await (async () => {
      const supabase = await createClient();
      return Promise.all(persistedReferences.map(async (reference) => {
        const { data, error } = await supabase.storage
          .from("product-assets")
          .createSignedUrl(reference.object_path, 3600);
        return error || !data?.signedUrl ? null : data.signedUrl;
      }));
    })()
    : [];

  setRequestLocale(locale);

  const createdDate = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(project.created_at),
  );
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const costFormatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
  });
  const visualGenerations: GenerationGalleryItem[] = generations
    .filter((generation) => Boolean(generation.preview_url))
    .map((generation, index) => ({
      id: generation.id,
      previewUrl: generation.preview_url as string,
      alt: `${t("outputs.previewAlt")} ${index + 1}`,
      typeLabel: t(`outputs.types.${generation.generation_type}`),
      statusLabel: t(`outputs.status.${generation.status}`),
      createdAt: dateFormatter.format(new Date(generation.created_at)),
      provider: generation.provider,
      model: generation.model,
      cost: generation.cost_usd === null ? null : costFormatter.format(generation.cost_usd),
      direction: generation.creative_direction_snapshot,
    }));
  const statusGenerations = generations.filter((generation) => !generation.preview_url);

  return (
    <main className="dashboard-main">
      <div className="dashboard-main-inner project-page-shell">
        <header className="project-page-header">
          <Link href="/dashboard" className="project-back-link">
            <span aria-hidden="true">←</span>
            {t("backToWorkspace")}
          </Link>
          <div className="project-title-row">
            <div>
              <span className="project-page-eyebrow">{t("outputs.heading")}</span>
              <h1 id="project-heading">{project.title ?? t("untitledProject")}</h1>
            </div>
            <div className="project-page-meta">
              <span>{t(`status.${project.status}`)}</span>
              <time dateTime={project.created_at}>{t("created", { date: createdDate })}</time>
            </div>
          </div>
        </header>

        <div className="project-workspace-layout">
          <section className="project-output-panel" aria-labelledby="generated-outputs-heading">
            <div className="project-panel-heading">
              <div>
                <span>{t("outputs.galleryEyebrow")}</span>
                <h2 id="generated-outputs-heading">{t("outputs.heading")}</h2>
              </div>
              <p>{t("outputs.description")}</p>
            </div>

            <GenerationGallery
              items={visualGenerations}
              messages={{
                featured: t("outputs.featured"),
                openFullscreen: t("outputs.openFullscreen"),
                closeFullscreen: t("outputs.closeFullscreen"),
                galleryLabel: t("outputs.galleryLabel"),
                selectOutput: t("outputs.selectOutput"),
                details: t("outputs.details"),
                direction: t("outputs.direction"),
                provider: t("outputs.provider"),
                model: t("outputs.model"),
                created: t("outputs.created"),
                cost: t("outputs.cost"),
                emptyHeading: t("outputs.emptyHeading"),
                emptyDescription: t("outputs.emptyDescription"),
              }}
            />

            {statusGenerations.length > 0 ? (
              <section className="project-generation-history" aria-labelledby="generation-history-heading">
                <h3 id="generation-history-heading">{t("outputs.historyHeading")}</h3>
                <ul>
                  {statusGenerations.map((generation) => (
                    <li key={generation.id}>
                      <div className="project-generation-history-copy">
                        <div>
                          <span>{t(`outputs.types.${generation.generation_type}`)}</span>
                          <span>{t(`outputs.status.${generation.status}`)}</span>
                          <time dateTime={generation.created_at}>
                            {dateFormatter.format(new Date(generation.created_at))}
                          </time>
                        </div>
                        <p>{generation.creative_direction_snapshot}</p>
                      </div>

                      {generation.generation_type === "image" && generation.status === "queued" ? (
                        <RunGenerationButton
                          action={runQueuedImageGeneration.bind(null, project.id, generation.id)}
                          messages={{
                            run: t("generation.run"),
                            running: t("generation.running"),
                            generationFailed: t("generation.generationFailed"),
                            notQueued: t("generation.notQueued"),
                          }}
                        />
                      ) : null}

                      {generation.status === "failed" && generation.error_message ? (
                        <p role="alert" className="project-generation-error">
                          {t("generation.generationFailed")}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </section>

          <aside className="project-settings-panel" aria-labelledby="project-settings-heading">
            <div className="project-panel-heading is-compact">
              <div>
                <span>{t("settingsEyebrow")}</span>
                <h2 id="project-settings-heading">{t("workspaceHeading")}</h2>
              </div>
            </div>
            <p className="project-settings-description">{t("workspaceDescription")}</p>

            <div className="project-setting-block">
              <ProductImageUpload
                projectId={project.id}
                userId={userId}
                initialAsset={initialAsset}
                registerAsset={registerProductAsset.bind(null, locale)}
              />
            </div>

            {referencePreviewUrls.some(Boolean) ? (
              <section className="project-setting-block" aria-labelledby="project-references-heading">
                <h3 id="project-references-heading" className="text-base font-semibold tracking-[-0.02em] text-[var(--dashboard-foreground)]">
                  {t("references.heading")}
                </h3>
                <p className="mt-1 text-sm leading-6 text-[var(--dashboard-muted)]">{t("references.description")}</p>
                <div className="mt-3 flex gap-2">
                  {referencePreviewUrls.map((signedUrl, index) => signedUrl ? (
                    // Signed Storage URLs are intentionally loaded directly, without Next's image optimizer.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={persistedReferences[index]?.id} src={signedUrl} alt={t("references.previewAlt", { index: index + 1 })} className="size-14 rounded-[var(--radius-sm)] object-cover" />
                  ) : null)}
                </div>
              </section>
            ) : null}

            <div className="project-setting-block">
              <CreativeDirectionForm
                creativeDirection={project.creative_direction}
                projectId={project.id}
                locale={locale}
                messages={{
                  label: t("creativeDirection.label"),
                  description: t("creativeDirection.description"),
                  placeholder: t("creativeDirection.placeholder"),
                  save: t("creativeDirection.save"),
                  saving: t("creativeDirection.saving"),
                  validationError: t("creativeDirection.validationError"),
                  saveError: t("creativeDirection.saveError"),
                  saveSuccess: t("creativeDirection.saveSuccess"),
                }}
              />
            </div>

            <div className="project-setting-block">
              <GenerateImageForm
                action={createQueuedImageGeneration.bind(null, locale, project.id)}
                messages={{
                  generate: t("generation.generate"),
                  creating: t("generation.creating"),
                  missingProductImage: t("generation.missingProductImage"),
                  missingCreativeDirection: t("generation.missingCreativeDirection"),
                  creationFailed: t("generation.creationFailed"),
                  enhanceWithAI: t("generation.enhanceWithAI"),
                  enhanceWithAIHelper: t("generation.enhanceWithAIHelper"),
                }}
              />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
