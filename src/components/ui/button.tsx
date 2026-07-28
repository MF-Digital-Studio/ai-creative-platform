import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

type ButtonVariantClasses = {
  button: string;
  fill: string;
};

const variantClasses: Record<ButtonVariant, ButtonVariantClasses> = {
  primary: {
    button: "border-[var(--accent)] bg-[var(--accent)] text-[var(--surface)]",
    fill: "bg-[var(--accent)] brightness-90 motion-reduce:!translate-y-full",
  },
  secondary: {
    button: "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]",
    fill: "bg-[var(--accent-soft)] motion-reduce:!translate-y-full",
  },
  ghost: {
    button:
      "border-transparent bg-transparent text-[var(--foreground)] [@media(hover:hover)]:hover:text-[var(--accent)]",
    fill:
      "top-auto bottom-0 h-px translate-y-0 origin-left scale-x-0 bg-[var(--accent)] [@media(hover:hover)]:group-hover:scale-x-100 motion-reduce:!translate-y-0 motion-reduce:!scale-x-0",
  },
  dark: {
    button: "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]",
    fill: "bg-[var(--accent)] motion-reduce:!translate-y-full",
  },
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-6 text-base",
};

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  const isTextLabel =
    typeof children === "string" || typeof children === "number";

  return (
    <button
      className={cn(
        "button-roll group relative isolate inline-flex shrink-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-[var(--radius-md)] border font-medium tracking-[-0.01em] transition-[background-color,border-color,color,transform] duration-(--button-transition-duration) ease-(--button-transition-ease) [@media(hover:hover)]:hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none",
        variantClasses[variant].button,
        sizeClasses[size],
        className,
      )}
      type={type}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-0 translate-y-full transition-transform duration-(--button-transition-duration) ease-(--button-transition-ease) [@media(hover:hover)]:group-hover:translate-y-0 motion-reduce:transition-none",
          variantClasses[variant].fill,
        )}
      />
      {isTextLabel ? (
        <span className="relative z-10 inline-flex items-center justify-center">
          <span className="sr-only">{children}</span>
          <span aria-hidden="true" className="button-label-viewport">
            <span className="button-label-copy button-label-copy-current">
              {children}
            </span>
            <span className="button-label-copy button-label-copy-next">
              {children}
            </span>
          </span>
        </span>
      ) : (
        <span className="button-label-fallback relative z-10 inline-flex items-center justify-center">
          {children}
        </span>
      )}
    </button>
  );
}
