"use client";

import { useState } from "react";

export type FaqAccordionItem = {
  id: string;
  question: string;
  answer: string;
};

type FaqAccordionProps = {
  items: FaqAccordionItem[];
};

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openItemId, setOpenItemId] = useState<string | null>(
    items[0]?.id ?? null,
  );

  return (
    <div className="divide-y divide-[var(--border)]">
      {items.map((item) => {
        const isOpen = openItemId === item.id;
        const triggerId = `faq-trigger-${item.id}`;
        const panelId = `faq-panel-${item.id}`;

        return (
          <div key={item.id}>
            <h3>
              <button
                id={triggerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() =>
                  setOpenItemId((currentId) =>
                    currentId === item.id ? null : item.id,
                  )
                }
                className="group flex min-h-14 w-full items-center justify-between gap-5 py-5 text-left text-base font-semibold leading-6 text-[var(--foreground)] outline-none transition-colors duration-[var(--transition-fast)] hover:text-[var(--foreground)] focus-visible:rounded-[var(--radius-sm)] focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)] sm:min-h-16 sm:py-6 sm:text-lg sm:leading-7"
              >
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className="relative size-4 shrink-0 text-[var(--accent)]"
                >
                  <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
                  <span
                    className={`absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current transition-transform duration-300 motion-reduce:transition-none ${
                      isOpen ? "scale-y-0" : "scale-y-100"
                    }`}
                  />
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              aria-hidden={!isOpen}
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <p className="max-w-2xl pb-7 pr-9 text-sm leading-7 text-[var(--foreground-muted)] sm:pb-8 sm:text-base sm:leading-8">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
