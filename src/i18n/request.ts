import {notFound} from "next/navigation";
import {getRequestConfig} from "next-intl/server";

import {isSupportedLocale} from "@/i18n/routing";

export default getRequestConfig(async ({requestLocale}) => {
  const locale = await requestLocale;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
