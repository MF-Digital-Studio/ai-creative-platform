"use client";

import { useEffect, useRef, type ReactNode } from "react";

type HowItWorksRevealProps = {
  children: ReactNode;
};

export function HowItWorksReveal({ children }: HowItWorksRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      root.dataset.revealed = "true";
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        root.dataset.revealed = "true";
        observer.disconnect();
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.12,
      },
    );

    observer.observe(root);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className="how-it-works-reveal"
      data-revealed="false"
    >
      {children}
    </div>
  );
}
