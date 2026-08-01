"use client";

import { useEffect, useRef, type CSSProperties } from "react";

import { cn } from "@/lib/cn";

type AnimatedHeadingProps = {
  as?: "h1" | "h2";
  className?: string;
  id?: string;
  lines: string[];
  style?: CSSProperties;
  variant?: "hero" | "section" | "footer";
};

export function AnimatedHeading({ as: Tag = "h2", className, id, lines, style, variant = "section" }: AnimatedHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.documentElement.dataset.motion = "ready";
    if (variant === "hero") return;
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
    }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [variant]);

  const fullText = lines.join(" ");
  let index = 0;
  return <Tag ref={ref} id={id} style={style} data-motion-revealed={variant === "hero" ? "true" : "false"} data-motion-variant={variant} className={cn("animated-heading", className)}>
    <span className="sr-only">{fullText}</span>
    <span aria-hidden="true" className="animated-heading-visual">
      {lines.map((line) => <span className="animated-heading-line" key={`${line}-${index}`}>
        {line.split(/(\s+)/).map((segment) => {
          const current = index++;
          return <span key={`${segment}-${current}`} className="animated-heading-segment" style={{ "--heading-index": current } as CSSProperties}>{segment}</span>;
        })}
      </span>)}
      {variant === "hero" ? <span className="animated-heading-caret" /> : null}
    </span>
  </Tag>;
}
