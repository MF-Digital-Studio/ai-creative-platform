import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link, getPathname } from "@/i18n/navigation";
import { ProductImageUpload } from "@/components/projects/product-image-upload";
import { registerProductAsset } from "@/app/[locale]/dashboard/projects/[projectId]/actions";
import { isSupportedLocale } from "@/i18n/routing";
import { getProjectProductAsset } from "@/lib/assets/get-project-product-asset";
import { getAuthenticatedUserId } from "@/lib/auth/require-user";
import { getProject } from "@/lib/projects/get-project";
import { createClient } from "@/lib/supabase/server";

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

  const persistedAsset = await getProjectProductAsset(userId, projectId);
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
          </div>
        </section>
      </div>
    </main>
  );
}
