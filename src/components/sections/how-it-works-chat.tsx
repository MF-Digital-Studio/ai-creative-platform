"use client";

import { useEffect, useRef, useState } from "react";

type HowItWorksChatProps = {
  prompt: string;
  response: string;
  sendLabel: string;
};

export function HowItWorksChat({
  prompt,
  response,
  sendLabel,
}: HowItWorksChatProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const [visibleCharacters, setVisibleCharacters] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    if (reducedMotion.matches) {
      return;
    }

    let typingDelay: ReturnType<typeof setTimeout> | undefined;
    let typingTimer: ReturnType<typeof setInterval> | undefined;
    let responseDelay: ReturnType<typeof setTimeout> | undefined;

    const startTyping = () => {
      if (startedRef.current) {
        return;
      }

      startedRef.current = true;
      typingDelay = setTimeout(() => {
        let characterIndex = 0;

        typingTimer = setInterval(() => {
          characterIndex += 1;
          setVisibleCharacters(characterIndex);

          if (characterIndex < prompt.length) {
            return;
          }

          if (typingTimer) {
            clearInterval(typingTimer);
          }

          responseDelay = setTimeout(() => setIsComplete(true), 400);
        }, 24);
      }, 250);
    };

    if (!("IntersectionObserver" in window)) {
      startTyping();
    }

    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([entry]) => {
              if (!entry?.isIntersecting) {
                return;
              }

              startTyping();
              observer?.disconnect();
            },
            { threshold: 0.45 },
          )
        : undefined;

    if (observer) {
      observer.observe(root);
    }

    return () => {
      observer?.disconnect();

      if (typingDelay) {
        clearTimeout(typingDelay);
      }

      if (typingTimer) {
        clearInterval(typingTimer);
      }

      if (responseDelay) {
        clearTimeout(responseDelay);
      }
    };
  }, [prompt]);

  return (
    <>
      <div
        ref={rootRef}
        className="how-it-works-prompt mt-3 rounded-[var(--radius-sm)] border border-[var(--workspace-line-strong)] bg-[var(--workspace-control)] p-3"
      >
        <p className="min-h-15 text-sm leading-5 text-[var(--workspace-text)]">
          <span className="sr-only">{prompt}</span>
          <span aria-hidden="true" className="how-it-works-prompt-typed">
            {prompt.slice(0, visibleCharacters)}
            <span className="how-it-works-caret" />
          </span>
          <span aria-hidden="true" className="how-it-works-prompt-reduced">
            {prompt}
          </span>
        </p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <span
            aria-hidden="true"
            className={`how-it-works-accent-dot size-1.5 shrink-0 rounded-full bg-[var(--accent)] ${
              isComplete ? "is-complete" : ""
            }`}
          />
          <button
            type="button"
            disabled
            aria-label={sendLabel}
            className={`how-it-works-send flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white ${
              isComplete ? "is-complete" : ""
            }`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="size-4"
              fill="none"
            >
              <path
                d="M5 15 15 5m0 0H7m8 0v8"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>
      </div>

      <p
        className={`how-it-works-chat-response mt-auto border-l border-[var(--accent)] pl-3 pt-5 text-xs leading-5 text-[var(--workspace-muted)] ${
          isComplete ? "is-complete" : ""
        }`}
      >
        {response}
      </p>
    </>
  );
}
