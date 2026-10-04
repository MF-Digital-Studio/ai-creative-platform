import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "public";
};

export function Container({ className, variant = "default", ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        variant === "public"
          ? "public-container"
          : "mx-auto w-full max-w-[var(--container)] px-[var(--container-padding)]",
        className,
      )}
      {...props}
    />
  );
}
