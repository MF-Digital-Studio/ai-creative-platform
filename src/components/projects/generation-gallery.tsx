"use client";

import { useState, type ReactNode } from "react";
import type { GenerationStatus } from "@/lib/projects/get-projects";
import { ProjectImageViewer } from "@/components/projects/project-image-viewer";
import {AppState} from "@/components/ui/app-state";

export type GenerationGalleryItem = {
  id: string;
  previewUrl: string | null;
  alt: string;
  typeLabel: string;
  status: GenerationStatus;
  statusLabel: string;
  createdAt: string;
  createdDateTime: string;
  provider: string;
  model: string;
  aspectRatio: string | null;
  cost: string | null;
  direction: string;
};

type GalleryMessages = {
  openFullscreen: string;
  edit: string;
  closeFullscreen: string;
  zoomImage: string;
  zoomOutImage: string;
  resetImageZoom: string;
  galleryLabel: string;
  selectOutput: string;
  details: string;
  status: string;
  format: string;
  type: string;
  advancedDetails: string;
  direction: string;
  provider: string;
  model: string;
  created: string;
  cost: string;
  emptyHeading: string;
  emptyDescription: string;
  noPreview: string;
  noPreviewDescription: string;
  goToControls: string;
  failedHeading: string;
  failedDescription: string;
  queuedHeading: string;
  queuedDescription: string;
  processingHeading: string;
  processingDescription: string;
  historyHeading: string;
};

type GenerationGalleryProps = {
  items: GenerationGalleryItem[];
  controls: ReactNode;
  runActions: { id: string; node: ReactNode }[];
  onSelectionChange: (id: string | null) => void;
  messages: GalleryMessages;
  initialSelectedGenerationId?: string | null;
};

function OutputState({ heading, description, busy = false, action }: { heading: string; description: string; busy?: boolean; action?: string }) {
  return <div className="project-viewer-state" aria-busy={busy} role={busy ? "status" : undefined} aria-live={busy ? "polite" : undefined}>
    <span className="project-viewer-state-mark" aria-hidden="true" />
    <h3>{heading}</h3><p>{description}</p>{action ? <a href="#project-controls-heading" className="project-viewer-empty-action">{action}</a> : null}
  </div>;
}

function OutputDetails({ item, messages }: { item: GenerationGalleryItem; messages: GalleryMessages }) {
  return <section className="project-inspector-details" aria-labelledby="project-output-details-heading">
    <h3 id="project-output-details-heading">{messages.details}</h3>
    <dl className="project-output-summary"><div><dt>{messages.format}</dt><dd>{item.aspectRatio ?? "—"}</dd></div><div><dt>{messages.created}</dt><dd><time dateTime={item.createdDateTime}>{item.createdAt}</time></dd></div><div><dt>{messages.type}</dt><dd>{item.typeLabel}</dd></div><div><dt>{messages.status}</dt><dd>{item.statusLabel}</dd></div></dl>
    <details className="project-output-disclosure">
      <summary>{messages.advancedDetails}</summary>
      <dl><div><dt>{messages.provider}</dt><dd>{item.provider}</dd></div><div><dt>{messages.model}</dt><dd>{item.model}</dd></div>{item.cost ? <div><dt>{messages.cost}</dt><dd>{item.cost}</dd></div> : null}</dl>
      <div className="project-output-advanced-direction"><strong>{messages.direction}</strong><p>{item.direction}</p></div>
    </details>
  </section>;
}

export function GenerationGallery({ items, controls, runActions, onSelectionChange, messages, initialSelectedGenerationId }: GenerationGalleryProps) {
  const [selection, setSelection] = useState<{ id: string; latestId: string } | null>(() => initialSelectedGenerationId ? { id: initialSelectedGenerationId, latestId: items[0]?.id ?? "" } : null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const latestId = items[0]?.id ?? "";
  const selected = selection?.latestId === latestId ? items.find((item) => item.id === selection.id) ?? items[0] : items[0];
  function openFullscreen() {
    if (selected?.previewUrl) setViewerOpen(true);
  }

  return <>
    <div className="project-workspace-layout">
      <section className="project-review-panel project-canvas" aria-label={messages.galleryLabel}>
        <div className="project-canvas-toolbar">
          <span className="dashboard-status" data-status={selected?.status ?? "draft"}><span aria-hidden="true" />{selected?.statusLabel ?? messages.emptyHeading}</span>
          <div>
            <a href="#project-image-edit">{messages.edit}</a>
            <button type="button" disabled={!selected?.previewUrl} onClick={openFullscreen}>{messages.openFullscreen}</button>
          </div>
        </div>
        <div className="project-featured-stage">
          {selected?.previewUrl ? <>
            <button type="button" className="project-featured-image-button" aria-label={messages.openFullscreen} onClick={openFullscreen}>
              {/* Private signed URLs intentionally bypass the public image optimizer. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.previewUrl} alt={selected.alt} />
            </button>
          </> : selected?.status === "failed" ? <OutputState heading={messages.failedHeading} description={messages.failedDescription} />
            : selected?.status === "processing" ? <OutputState heading={messages.processingHeading} description={messages.processingDescription} busy />
              : selected?.status === "queued" ? <OutputState heading={messages.queuedHeading} description={messages.queuedDescription} />
                : selected ? <OutputState heading={messages.noPreview} description={messages.noPreviewDescription} />
                  : <OutputState heading={messages.emptyHeading} description={messages.emptyDescription} action={messages.goToControls} />}
        </div>
      </section>
      <aside className="project-inspector" aria-label={messages.details}>
        {controls}
        {selected ? <OutputDetails item={selected} messages={messages} /> : null}
      </aside>
    </div>
    <section className="project-generation-history" aria-labelledby="project-generation-history-heading">
      <div className="dashboard-section-heading"><h2 id="project-generation-history-heading">{messages.historyHeading}</h2></div>
      {items.length > 0 ? <ul className="project-generation-history-list" aria-label={messages.historyHeading}>{items.map((item) => <li key={item.id} className="project-generation-history-item">
        <button type="button" className="project-generation-history-select" aria-pressed={item.id === selected?.id} aria-label={`${messages.selectOutput}: ${item.createdAt}`} onClick={() => { setSelection({ id: item.id, latestId }); onSelectionChange(item.status === "succeeded" && item.previewUrl ? item.id : null); }}>
          <span className="project-generation-history-media">{item.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.previewUrl} alt="" />
          ) : <span aria-hidden="true" />}</span>
          <span className="project-generation-history-copy"><strong>{item.typeLabel}</strong><time dateTime={item.createdDateTime}>{item.createdAt}</time><span className="dashboard-status" data-status={item.status}><span aria-hidden="true" />{item.statusLabel}</span></span>
        </button>
        {runActions.find((action) => action.id === item.id)?.node}
      </li>)}</ul> : <AppState compact icon="spark" title={messages.emptyHeading} description={messages.emptyDescription} />}
    </section>
    {selected?.previewUrl ? <ProjectImageViewer src={selected.previewUrl} alt={selected.alt} open={viewerOpen} closeLabel={messages.closeFullscreen} zoomInLabel={messages.zoomImage} zoomOutLabel={messages.zoomOutImage} resetLabel={messages.resetImageZoom} onOpenChange={setViewerOpen} /> : null}
  </>;
}
