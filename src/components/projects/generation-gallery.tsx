"use client";

import { useState, type ReactNode } from "react";
import type { GenerationStatus } from "@/lib/projects/get-projects";
import { ProjectImageViewer } from "@/components/projects/project-image-viewer";

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
  cost: string | null;
  direction: string;
};

type GalleryMessages = {
  openFullscreen: string;
  closeFullscreen: string;
  zoomImage: string;
  zoomOutImage: string;
  resetImageZoom: string;
  galleryLabel: string;
  selectOutput: string;
  details: string;
  status: string;
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
};

function OutputState({ heading, description, busy = false, action }: { heading: string; description: string; busy?: boolean; action?: string }) {
  return <div className="project-viewer-state" aria-busy={busy} role={busy ? "status" : undefined} aria-live={busy ? "polite" : undefined}>
    <span className="project-viewer-state-mark" aria-hidden="true" />
    <h3>{heading}</h3><p>{description}</p>{action ? <a href="#project-controls-heading" className="project-viewer-empty-action">{action}</a> : null}
  </div>;
}

function OutputDetails({ item, messages }: { item: GenerationGalleryItem; messages: GalleryMessages }) {
  return <div className="project-output-disclosures">
    <details className="project-output-disclosure">
      <summary>{messages.details}</summary>
      <dl><div><dt>{messages.created}</dt><dd><time dateTime={item.createdDateTime}>{item.createdAt}</time></dd></div><div><dt>{messages.status}</dt><dd>{item.statusLabel}</dd></div></dl>
    </details>
    <details className="project-output-disclosure">
      <summary>{messages.advancedDetails}</summary>
      <dl><div><dt>{messages.provider}</dt><dd>{item.provider}</dd></div><div><dt>{messages.model}</dt><dd>{item.model}</dd></div>{item.cost ? <div><dt>{messages.cost}</dt><dd>{item.cost}</dd></div> : null}</dl>
      <div className="project-output-advanced-direction"><strong>{messages.direction}</strong><p>{item.direction}</p></div>
    </details>
  </div>;
}

export function GenerationGallery({ items, controls, runActions, onSelectionChange, messages }: GenerationGalleryProps) {
  const [selection, setSelection] = useState<{ id: string; latestId: string } | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const latestId = items[0]?.id ?? "";
  const selected = selection?.latestId === latestId ? items.find((item) => item.id === selection.id) ?? items[0] : items[0];
  const previewItems = items.filter((item) => item.previewUrl);

  function openFullscreen() {
    if (selected?.previewUrl) setViewerOpen(true);
  }

  return <>
    <div className="project-workspace-layout">
      <section className="project-review-panel" aria-label={messages.galleryLabel}>
        <div className="project-featured-stage">
          {selected?.previewUrl ? <>
            <button type="button" className="project-featured-image-button" aria-label={messages.openFullscreen} onClick={openFullscreen}>
              {/* Private signed URLs intentionally bypass the public image optimizer. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.previewUrl} alt={selected.alt} />
            </button>
            <button type="button" className="project-fullscreen-trigger" onClick={openFullscreen}>{messages.openFullscreen}</button>
          </> : selected?.status === "failed" ? <OutputState heading={messages.failedHeading} description={messages.failedDescription} />
            : selected?.status === "processing" ? <OutputState heading={messages.processingHeading} description={messages.processingDescription} busy />
              : selected?.status === "queued" ? <OutputState heading={messages.queuedHeading} description={messages.queuedDescription} />
                : selected ? <OutputState heading={messages.noPreview} description={messages.noPreviewDescription} />
                  : <OutputState heading={messages.emptyHeading} description={messages.emptyDescription} action={messages.goToControls} />}
        </div>
        {previewItems.length > 1 ? <div className="project-gallery-strip" role="group" aria-label={messages.galleryLabel}>
          {previewItems.map((item, index) => <button key={item.id} type="button" className="project-gallery-thumbnail" aria-pressed={item.id === selected?.id} aria-label={`${messages.selectOutput} ${index + 1}`} onClick={() => { setSelection({ id: item.id, latestId }); onSelectionChange(item.id); }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.previewUrl as string} alt="" />
          </button>)}
        </div> : null}
        {selected ? <OutputDetails item={selected} messages={messages} /> : null}
      </section>
      {controls}
    </div>
    {items.length > 0 ? <section className="project-generation-history" aria-labelledby="project-generation-history-heading">
      <div className="dashboard-section-heading"><h2 id="project-generation-history-heading">{messages.historyHeading}</h2></div>
      <ul className="project-generation-history-list">{items.map((item) => <li key={item.id} className="project-generation-history-item">
        <button type="button" className="project-generation-history-select" aria-pressed={item.id === selected?.id} aria-label={`${messages.selectOutput}: ${item.createdAt}`} onClick={() => { setSelection({ id: item.id, latestId }); onSelectionChange(item.status === "succeeded" && item.previewUrl ? item.id : null); }}>
          <span className="project-generation-history-media">{item.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.previewUrl} alt="" />
          ) : <span aria-hidden="true" />}</span>
          <span className="project-generation-history-copy"><strong>{item.typeLabel}</strong><time dateTime={item.createdDateTime}>{item.createdAt}</time><span className="dashboard-status" data-status={item.status}><span aria-hidden="true" />{item.statusLabel}</span></span>
        </button>
        {runActions.find((action) => action.id === item.id)?.node}
      </li>)}</ul>
    </section> : null}
    {selected?.previewUrl ? <ProjectImageViewer src={selected.previewUrl} alt={selected.alt} open={viewerOpen} closeLabel={messages.closeFullscreen} zoomInLabel={messages.zoomImage} zoomOutLabel={messages.zoomOutImage} resetLabel={messages.resetImageZoom} onOpenChange={setViewerOpen} /> : null}
  </>;
}
