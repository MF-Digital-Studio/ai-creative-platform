import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[var(--container)] px-[var(--container-padding)]",
        className,
      )}
      {...props}
    />
  );
}
