import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "accent" | "outline";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-transparent bg-[var(--surface-soft)] text-[var(--foreground)]",
  accent: "border-transparent bg-[var(--accent-soft)] text-[var(--accent)]",
  outline: "border-[var(--border)] bg-transparent text-[var(--foreground-muted)]",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-sm)] border px-3 py-1 text-xs font-medium leading-5 tracking-[-0.01em]",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
