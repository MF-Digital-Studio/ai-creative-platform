import {deleteProject} from "@/app/[locale]/dashboard/actions";
import {DeleteProjectButton} from "@/components/dashboard/delete-project-button";
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
    actionsFor: string;
    updated: string;
    delete: string;
    deleteHeading: string;
    deleteConfirm: string;
    cancel: string;
    deleting: string;
    deleteError: string;
  };
  verticals: Record<string, string>;
};

export function ProjectGalleryCard({project, locale, messages, verticals}: ProjectGalleryCardProps) {
  const title = project.title ?? messages.untitled;
  const href = `/dashboard/projects/${project.id}` as const;
  const date = new Intl.DateTimeFormat(locale, {dateStyle: "medium"}).format(new Date(project.updated_at));
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
          <span className="projects-gallery-meta">{project.vertical ? <span>{verticals[project.vertical]}</span> : null}<time dateTime={project.updated_at}>{messages.updated} {date}</time></span>
          <StatusBadge status={project.latest_generation?.status ?? project.status} kind={project.latest_generation ? "generation" : "project"} />
        </span>
      </Link>
      <details className="projects-card-menu">
        <summary aria-label={messages.actionsFor.replace("{title}", title)} title={messages.actionsFor.replace("{title}", title)}>···</summary>
        <div className="projects-card-menu-content">
          <Link href={href}>{messages.open}</Link>
          <DeleteProjectButton action={deleteProject.bind(null, locale, project.id)} trigger="menu" messages={{label: messages.delete, confirmHeading: messages.deleteHeading, confirm: messages.deleteConfirm.replace("{title}", title), cancel: messages.cancel, deleting: messages.deleting, error: messages.deleteError}} />
        </div>
      </details>
    </li>
  );
}
