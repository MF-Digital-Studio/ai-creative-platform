"use client";

import { useState } from "react";
import { ProjectImageViewer } from "@/components/projects/project-image-viewer";
import { DashboardIcon } from "@/components/dashboard/dashboard-icons";
import { Link } from "@/i18n/navigation";
import type { DashboardGeneration } from "@/lib/generations/get-dashboard-generations";

type Messages = {
  heading: string;
  emptyHeading: string;
  emptyDescription: string;
  start: string;
  untitled: string;
  previewAlt: string;
  fullscreen: string;
  project: string;
  edit: string;
  closeFullscreen: string;
  zoomIn: string;
  zoomOut: string;
  resetZoom: string;
};

export function RecentGenerationsGallery({ generations, messages, locale }: { generations: DashboardGeneration[]; messages: Messages; locale: string }) {
  const completed = generations.filter((generation) => generation.status === "succeeded" && generation.type === "image" && generation.previewUrl);
  const [viewerGenerationId, setViewerGenerationId] = useState<string | null>(null);
  const [menuGenerationId, setMenuGenerationId] = useState<string | null>(null);
  const viewerGeneration = completed.find((generation) => generation.id === viewerGenerationId) ?? null;
  const dateFormatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });

  return <section className="dashboard-content-section" aria-labelledby="recent-generations-title">
    <div className="dashboard-section-heading"><h2 id="recent-generations-title">{messages.heading}</h2></div>
    {completed.length === 0 ? <div className="dashboard-empty-state"><div className="dashboard-empty-mark" aria-hidden="true"><DashboardIcon name="assets" /></div><div><h3>{messages.emptyHeading}</h3><p>{messages.emptyDescription}</p></div><a href="#composer" className="dashboard-view-all-button">{messages.start}</a></div> :
      <ul className="dashboard-generation-grid">{completed.map((generation) => {
        const title = generation.projectTitle?.trim() || messages.untitled;
        const alt = messages.previewAlt.replace("{title}", title);
        const date = new Date(generation.createdAt);
        const formattedDate = dateFormatter.format(date);
        const formatLabel = generation.aspectRatio ? ` · ${generation.aspectRatio}` : "";
        const projectHref = `/dashboard/projects/${generation.projectId}?generation=${encodeURIComponent(generation.id)}`;
        return <li key={generation.id} className="dashboard-generation-item">
          <article className="dashboard-generation-card">
            <Link className="dashboard-generation-card-link" href={projectHref} aria-label={`${messages.project}: ${title}`} />
            <div className="dashboard-generation-media">
              {/* Private signed Storage URLs bypass Next's public image optimizer. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={generation.previewUrl as string} alt={alt} loading="lazy" />
              <div className="dashboard-generation-actions" aria-label={title}>
                <button type="button" aria-label={`${messages.fullscreen}: ${title}`} onClick={() => setViewerGenerationId(generation.id)}>{messages.fullscreen}</button>
                <Link href={`/dashboard/projects/${generation.projectId}?generation=${encodeURIComponent(generation.id)}#project-controls-heading`}>{messages.edit}</Link>
              </div>
              <button type="button" className="dashboard-generation-menu-trigger" aria-label={`${messages.project}: ${title}`} aria-expanded={menuGenerationId === generation.id} onClick={() => setMenuGenerationId((current) => current === generation.id ? null : generation.id)}><DashboardIcon name="menu" /></button>
              {menuGenerationId === generation.id ? <div className="dashboard-generation-mobile-menu">
                <button type="button" onClick={() => { setViewerGenerationId(generation.id); setMenuGenerationId(null); }}>{messages.fullscreen}</button>
                <Link href={`/dashboard/projects/${generation.projectId}?generation=${encodeURIComponent(generation.id)}#project-controls-heading`}>{messages.edit}</Link>
              </div> : null}
            </div>
            <div className="dashboard-generation-copy"><strong>{title}</strong><time dateTime={generation.createdAt}>{formattedDate}{formatLabel}</time></div>
          </article>
        </li>;
      })}</ul>}
    {viewerGeneration?.previewUrl ? <ProjectImageViewer src={viewerGeneration.previewUrl} alt={messages.previewAlt.replace("{title}", viewerGeneration.projectTitle?.trim() || messages.untitled)} open closeLabel={messages.closeFullscreen} zoomInLabel={messages.zoomIn} zoomOutLabel={messages.zoomOut} resetLabel={messages.resetZoom} onOpenChange={(open) => { if (!open) setViewerGenerationId(null); }} /> : null}
  </section>;
}
