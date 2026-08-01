"use client";

import { useEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type RevealProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  delay?: number;
  variant?: "fade" | "clip" | "media";
};

export function Reveal({ children, className, delay = 0, variant = "fade", ...props }: RevealProps) {
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

  return <div ref={ref} data-motion-revealed="false" data-motion-variant={variant} style={{ "--motion-delay": `${delay}ms` } as CSSProperties} className={cn("motion-reveal", className)} {...props}>{children}</div>;
}
