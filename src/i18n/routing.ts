import {hasLocale} from "next-intl";
import {defineRouting} from "next-intl/routing";

export const routing = defineRouting({
  locales: ["tr", "en"],
  defaultLocale: "tr",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];

export function isSupportedLocale(
  locale: string | undefined,
): locale is AppLocale {
  return hasLocale(routing.locales, locale);
}
