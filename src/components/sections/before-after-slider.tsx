"use client";

import Image from "next/image";
import { useState } from "react";

type BeforeAfterSliderProps = {
  beforeAlt: string;
  beforeCaption: string;
  beforeLabel: string;
  afterAlt: string;
  afterCaption: string;
  afterLabel: string;
  handleLabel: string;
};

const media = {
  before: "/before-after/ring-before.webp",
  after: "/before-after/ring-after.webp",
} as const;

export function BeforeAfterSlider({
  beforeAlt,
  beforeCaption,
  beforeLabel,
  afterAlt,
  afterCaption,
  afterLabel,
  handleLabel,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);

  return (
    <figure className="relative aspect-[5/6] w-full max-h-[26rem] overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface-soft)] select-none sm:aspect-[16/10] lg:h-[min(37vw,31.25rem)] lg:max-h-[31.25rem] lg:aspect-auto">
      <Image
        src={media.after}
        alt={afterAlt}
        fill
        sizes="(min-width: 1440px) 1344px, calc(100vw - 2.5rem)"
        className="pointer-events-none object-cover"
      />

      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <Image
          src={media.before}
          alt={beforeAlt}
          fill
          sizes="(min-width: 1440px) 1344px, calc(100vw - 2.5rem)"
          className="pointer-events-none object-cover"
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 p-3 sm:p-5">
        <div className="max-w-[46%] rounded-[var(--radius-sm)] bg-[var(--workspace-video-control)] px-3 py-2 text-white backdrop-blur-sm">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em]">
            {beforeLabel}
          </p>
          <p className="mt-0.5 truncate text-xs text-white/75">
            {beforeCaption}
          </p>
        </div>
        <div className="max-w-[46%] rounded-[var(--radius-sm)] bg-[var(--workspace-video-control)] px-3 py-2 text-right text-white backdrop-blur-sm">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em]">
            {afterLabel}
          </p>
          <p className="mt-0.5 truncate text-xs text-white/75">
            {afterCaption}
          </p>
        </div>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-label={handleLabel}
        className="before-after-range peer absolute inset-0 z-20 m-0 h-full w-full"
      />

      <div
        aria-hidden="true"
        className="before-after-divider pointer-events-none absolute inset-y-0 z-20 w-px -translate-x-1/2 bg-white/85 shadow-[0_0_0_1px_var(--border)]"
        style={{ left: `${position}%` }}
      >
        <span className="before-after-handle absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white text-[var(--foreground)] shadow-[var(--shadow-subtle)] transition-[outline-color,background-color] duration-[var(--transition-fast)] sm:size-12">
          <svg
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          >
            <path d="m9 8-4 4 4 4" />
            <path d="m15 8 4 4-4 4" />
          </svg>
        </span>
      </div>
    </figure>
  );
}
