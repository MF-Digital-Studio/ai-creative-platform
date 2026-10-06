import {ProjectCardMenu} from "@/components/projects/project-card-menu";
import {StatusBadge} from "@/components/dashboard/status-badge";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import type {Project} from "@/lib/projects/get-projects";

type ProjectGalleryCardProps = {
  project: Project;
  locale: AppLocale;
  messages: {
    untitled: string;
    previewAlt: string;
    noPreview: string;
    open: string;
    projectActions: string;
    delete: string;
    deleteProject: string;
    deleteHeading: string;
    deleteDescription: string;
    cancel: string;
    deleting: string;
    deleteError: string;
  };
  verticals: Record<string, string>;
};

export function ProjectGalleryCard({project, locale, messages, verticals}: ProjectGalleryCardProps) {
  const title = project.title ?? messages.untitled;
  const href = `/dashboard/projects/${project.id}` as const;
  const date = new Intl.DateTimeFormat(locale, {day: "numeric", month: "short", year: "numeric"}).format(new Date(project.updated_at));
  return (
    <li className="projects-gallery-item">
      <Link href={href} className="projects-gallery-card" aria-label={`${messages.open}: ${title}`}>
        <span className="projects-gallery-media">
          {project.thumbnail_url ? (
            // Private Storage previews use the existing signed URL pattern.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.thumbnail_url} alt={messages.previewAlt.replace("{title}", title)} loading="lazy" decoding="async" />
          ) : <span className="projects-gallery-placeholder" aria-hidden="true"><span className="projects-gallery-placeholder-mark">K</span><span>{messages.noPreview}</span></span>}
        </span>
        <span className="projects-gallery-copy">
          <span className="projects-gallery-title">{title}</span>
          <span className="projects-gallery-meta">
            {project.vertical ? <><span>{verticals[project.vertical]}</span><span aria-hidden="true">·</span></> : null}
            <time dateTime={project.updated_at}>{date}</time>
          </span>
          <StatusBadge status={project.latest_generation?.status ?? project.status} kind={project.latest_generation ? "generation" : "project"} />
        </span>
      </Link>
      <ProjectCardMenu projectId={project.id} locale={locale} menuLabel={messages.projectActions} deleteMessages={{title: messages.deleteHeading, description: messages.deleteDescription, menuItem: messages.deleteProject, cancel: messages.cancel, confirm: messages.deleteProject, deleting: messages.deleting, error: messages.deleteError}} />
    </li>
  );
}
