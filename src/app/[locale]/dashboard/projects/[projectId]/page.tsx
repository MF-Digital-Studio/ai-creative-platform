import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link, getPathname } from "@/i18n/navigation";
import { ProductImageUpload } from "@/components/projects/product-image-upload";
import { registerProductAsset } from "@/app/[locale]/dashboard/projects/[projectId]/actions";
import { isSupportedLocale } from "@/i18n/routing";
import { getProjectProductAsset } from "@/lib/assets/get-project-product-asset";
import { getAuthenticatedUserId } from "@/lib/auth/require-user";
import { getProjectGenerations } from "@/lib/generations/get-project-generations";
import { getProject } from "@/lib/projects/get-project";
import { createClient } from "@/lib/supabase/server";

import { CreativeDirectionForm } from "./creative-direction-form";

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
  if (!isSupportedLocale(locale)) {
    notFound();
  }
  if (!uuidPattern.test(projectId)) {
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

  const [persistedAsset, generations] = await Promise.all([
    getProjectProductAsset(userId, projectId),
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

  setRequestLocale(locale);

  const workspaceHref = getPathname({ href: "/dashboard", locale });
  const createdDate = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(project.created_at),
  );
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const costFormatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
  });

  return (
    <main className="dashboard-main">
      <div className="dashboard-main-inner">
        <section className="mx-auto grid w-full max-w-3xl gap-8" aria-labelledby="project-heading">
          <div className="grid gap-5">
            <Link
              href={workspaceHref}
              className="w-fit text-sm font-medium text-[var(--dashboard-muted)] transition-colors hover:text-[var(--dashboard-foreground)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--dashboard-focus)]"
            >
              {t("backToWorkspace")}
            </Link>

            <div className="grid gap-3">
              <h1 id="project-heading" className="font-[family-name:var(--font-display)] text-4xl font-medium tracking-[-0.045em] text-[var(--dashboard-foreground)] sm:text-5xl">
                {project.title ?? t("untitledProject")}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--dashboard-muted)]">
                <span>{t(`status.${project.status}`)}</span>
                <time dateTime={project.created_at}>{t("created", { date: createdDate })}</time>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--dashboard-border-strong)] bg-[var(--dashboard-surface)] p-5 sm:p-6">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[var(--dashboard-foreground)]">
              {t("workspaceHeading")}
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--dashboard-muted)]">
              {t("workspaceDescription")}
            </p>

            <div className="mt-6">
              <ProductImageUpload
                projectId={project.id}
                userId={userId}
                initialAsset={initialAsset}
                registerAsset={registerProductAsset.bind(null, locale)}
              />
            </div>

            <div className="mt-6">
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
          </div>

          <section aria-labelledby="generated-outputs-heading" className="rounded-[var(--radius-md)] border border-[var(--dashboard-border-strong)] bg-[var(--dashboard-surface)] p-5 sm:p-6">
            <div>
              <h2 id="generated-outputs-heading" className="text-lg font-semibold tracking-[-0.02em] text-[var(--dashboard-foreground)]">
                {t("outputs.heading")}
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--dashboard-muted)]">
                {t("outputs.description")}
              </p>
            </div>

            {generations.length === 0 ? (
              <p className="mt-6 rounded-[var(--radius-sm)] border border-[var(--dashboard-border)] bg-[var(--dashboard-background)] p-4 text-sm text-[var(--dashboard-muted)]">
                {t("outputs.empty")}
              </p>
            ) : (
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {generations.map((generation) => {
                  const createdAt = dateFormatter.format(new Date(generation.created_at));
                  const directionPreview = truncateText(generation.creative_direction_snapshot, 160);

                  return (
                    <li key={generation.id} className="overflow-hidden rounded-[var(--radius-sm)] border border-[var(--dashboard-border)] bg-[var(--dashboard-background)]">
                      <div className="aspect-[4/3] bg-[var(--dashboard-surface-raised)]">
                        {generation.preview_url ? (
                          // Signed Storage URLs are intentionally loaded directly, without Next's image optimizer.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={generation.preview_url} alt={t("outputs.previewAlt")} className="size-full object-cover" />
                        ) : (
                          <div className="grid size-full place-items-center p-4 text-center text-sm text-[var(--dashboard-muted)]">
                            {t("outputs.noPreview")}
                          </div>
                        )}
                      </div>

                      <div className="grid gap-3 p-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--dashboard-muted)]">
                          <span className="rounded-full border border-[var(--dashboard-border)] px-2 py-1">
                            {t(`outputs.types.${generation.generation_type}`)}
                          </span>
                          <span className="rounded-full border border-[var(--dashboard-border)] px-2 py-1">
                            {t(`outputs.status.${generation.status}`)}
                          </span>
                        </div>

                        <dl className="grid gap-1 text-sm text-[var(--dashboard-muted)]">
                          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                            <dt>{t("outputs.provider")}</dt>
                            <dd className="font-medium text-[var(--dashboard-foreground)]">{generation.provider}</dd>
                          </div>
                          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                            <dt>{t("outputs.model")}</dt>
                            <dd className="font-medium text-[var(--dashboard-foreground)]">{generation.model}</dd>
                          </div>
                          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                            <dt>{t("outputs.created")}</dt>
                            <dd className="font-medium text-[var(--dashboard-foreground)]">
                              <time dateTime={generation.created_at}>{createdAt}</time>
                            </dd>
                          </div>
                          {generation.cost_usd !== null ? (
                            <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                              <dt>{t("outputs.cost")}</dt>
                              <dd className="font-medium text-[var(--dashboard-foreground)]">
                                {costFormatter.format(generation.cost_usd)}
                              </dd>
                            </div>
                          ) : null}
                        </dl>

                        <p className="text-sm leading-6 text-[var(--dashboard-muted)]">
                          <span className="font-medium text-[var(--dashboard-foreground)]">{t("outputs.direction")}: </span>
                          {directionPreview}
                        </p>

                        {generation.status === "failed" && generation.error_message ? (
                          <p role="alert" className="rounded-[var(--radius-sm)] border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-raised)] p-3 text-sm leading-6 text-[var(--dashboard-foreground)]">
                            <span className="font-medium">{t("outputs.error")}: </span>
                            {generation.error_message}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function truncateText(value: string, maximumLength: number) {
  const characters = Array.from(value);
  return characters.length > maximumLength
    ? `${characters.slice(0, maximumLength).join("")}…`
    : value;
}
