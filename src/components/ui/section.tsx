import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type SectionSpacing = "default" | "compact" | "large";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  spacing?: SectionSpacing;
}

const spacingClasses: Record<SectionSpacing, string> = {
  default: "py-[var(--section-space)]",
  compact: "py-[var(--section-space-compact)]",
  large: "py-[var(--section-space-large)]",
};

export function Section({
  className,
  spacing = "default",
  ...props
}: SectionProps) {
  return (
    <section className={cn(spacingClasses[spacing], className)} {...props} />
  );
}
