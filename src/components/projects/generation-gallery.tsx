"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/cn";

export type GenerationGalleryItem = {
  id: string;
  previewUrl: string;
  alt: string;
  typeLabel: string;
  statusLabel: string;
  createdAt: string;
  provider: string;
  model: string;
  cost: string | null;
  direction: string;
};

type GenerationGalleryProps = {
  items: GenerationGalleryItem[];
  messages: {
    featured: string;
    openFullscreen: string;
    closeFullscreen: string;
    galleryLabel: string;
    selectOutput: string;
    details: string;
    direction: string;
    provider: string;
    model: string;
    created: string;
    cost: string;
    emptyHeading: string;
    emptyDescription: string;
  };
};

export function GenerationGallery({ items, messages }: GenerationGalleryProps) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];

  if (!selected) {
    return (
      <div className="project-gallery-empty">
        <span className="project-gallery-empty-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="m12 3 1.3 4.2a5.2 5.2 0 0 0 3.5 3.5L21 12l-4.2 1.3a5.2 5.2 0 0 0-3.5 3.5L12 21l-1.3-4.2a5.2 5.2 0 0 0-3.5-3.5L3 12l4.2-1.3a5.2 5.2 0 0 0 3.5-3.5L12 3Z" />
          </svg>
        </span>
        <div>
          <h3>{messages.emptyHeading}</h3>
          <p>{messages.emptyDescription}</p>
        </div>
      </div>
    );
  }

  function openFullscreen() {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }

  return (
    <div className="project-generation-gallery">
      <div className="project-featured-stage">
        <span className="project-featured-label">{messages.featured}</span>
        <button
          type="button"
          className="project-featured-image-button"
          aria-label={messages.openFullscreen}
          onClick={openFullscreen}
        >
          {/* Private signed URLs intentionally bypass the public image optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selected.previewUrl} alt={selected.alt} />
        </button>
        <button
          type="button"
          className="project-fullscreen-trigger"
          onClick={openFullscreen}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{messages.openFullscreen}</span>
        </button>
      </div>

      {items.length > 1 ? (
        <div className="project-gallery-strip" role="group" aria-label={messages.galleryLabel}>
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={cn("project-gallery-thumbnail", item.id === selected.id && "is-active")}
              aria-pressed={item.id === selected.id}
              aria-label={`${messages.selectOutput} ${index + 1}`}
              onClick={() => setSelectedId(item.id)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.previewUrl} alt="" />
            </button>
          ))}
        </div>
      ) : null}

      <section className="project-output-details" aria-labelledby="selected-output-details">
        <div className="project-output-details-heading">
          <div>
            <span>{selected.typeLabel} · {selected.statusLabel}</span>
            <h3 id="selected-output-details">{messages.details}</h3>
          </div>
          <time>{selected.createdAt}</time>
        </div>
        <dl>
          <div><dt>{messages.provider}</dt><dd>{selected.provider}</dd></div>
          <div><dt>{messages.model}</dt><dd>{selected.model}</dd></div>
          <div><dt>{messages.created}</dt><dd>{selected.createdAt}</dd></div>
          {selected.cost ? <div><dt>{messages.cost}</dt><dd>{selected.cost}</dd></div> : null}
        </dl>
        <div className="project-output-direction">
          <span>{messages.direction}</span>
          <p>{selected.direction}</p>
        </div>
      </section>

      <dialog
        ref={dialogRef}
        className="project-lightbox"
        aria-label={messages.openFullscreen}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            event.currentTarget.close();
          }
        }}
      >
        <button
          type="button"
          className="project-lightbox-close"
          aria-label={messages.closeFullscreen}
          onClick={() => dialogRef.current?.close()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
          </svg>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={selected.previewUrl} alt={selected.alt} />
      </dialog>
    </div>
  );
}
