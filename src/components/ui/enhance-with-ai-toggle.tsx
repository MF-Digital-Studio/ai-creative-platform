"use client";

import { useId } from "react";

type EnhanceWithAIToggleProps = {
  checked: boolean;
  description: string;
  disabled?: boolean;
  label: string;
  name?: string;
  onChange: (checked: boolean) => void;
};

export function EnhanceWithAIToggle({
  checked,
  description,
  disabled = false,
  label,
  name,
  onChange,
}: EnhanceWithAIToggleProps) {
  const descriptionId = useId();
  const inputId = useId();

  return (
    <div className="grid gap-1">
      <label htmlFor={inputId} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--dashboard-foreground)]">
        <input
          checked={checked}
          className="h-4 w-4 accent-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          disabled={disabled}
          id={inputId}
          name={name}
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
          aria-describedby={descriptionId}
        />
        {label}
      </label>
      <p id={descriptionId} className="pl-6 text-xs leading-5 text-[var(--dashboard-muted)]">
        {description}
      </p>
    </div>
  );
}
