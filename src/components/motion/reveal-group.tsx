"use client";

import { useEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type RevealGroupProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  stagger?: number;
  variant?: "cards" | "logos" | "rows";
};

export function RevealGroup({ children, className, stagger = 60, variant = "cards", ...props }: RevealGroupProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || !("IntersectionObserver" in window)) {
      element.dataset.motionRevealed = "true";
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      element.dataset.motionRevealed = "true";
      observer.disconnect();
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} data-motion-revealed="false" data-motion-variant={variant} style={{ "--motion-stagger": `${stagger}ms` } as CSSProperties} className={cn("motion-reveal-group", className)} {...props}>{children}</div>;
}
