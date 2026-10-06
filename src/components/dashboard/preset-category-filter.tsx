import type { SupportedVertical } from "@/lib/verticals/supported-verticals";
import { DashboardIcon } from "@/components/dashboard/dashboard-icons";
import { cn } from "@/lib/cn";

export type PresetCategoryFilterValue = "all" | SupportedVertical;

type PresetCategoryFilterProps = {
  value: PresetCategoryFilterValue;
  onChange: (value: PresetCategoryFilterValue) => void;
  label: string;
  options: readonly {
    value: PresetCategoryFilterValue;
    label: string;
    countLabel: string;
    icon: "allCategories" | "apparel" | "jewelry" | "watch" | "footwear" | "cosmetics" | "bag";
  }[];
};

export function PresetCategoryFilter({ value, onChange, label, options }: PresetCategoryFilterProps) {
  return (
    <div className="preset-category-filter" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={cn("preset-category-option", value === option.value && "is-selected")}
          onClick={() => onChange(option.value)}
        >
          <span className="preset-category-icon-wrap" aria-hidden="true">
            <DashboardIcon name={option.icon} className="preset-category-icon" />
          </span>
          <span className="preset-category-name">{option.label}</span>
          <span className="preset-category-count">{option.countLabel}</span>
        </button>
      ))}
    </div>
  );
}
