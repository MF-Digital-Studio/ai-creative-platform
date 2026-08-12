import {NextResponse, type NextRequest} from "next/server";

import {isSupportedLocale} from "@/i18n/routing";
import {createClient} from "@/lib/supabase/server";

type CallbackContext = {
  params: Promise<{locale: string}>;
};

function getSafeNextPath(value: string | null, locale: string) {
  const fallback = `/${locale}/dashboard`;

  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  return value;
}

export async function GET(request: NextRequest, {params}: CallbackContext) {
  const {locale: requestedLocale} = await params;
  const locale = isSupportedLocale(requestedLocale) ? requestedLocale : "tr";
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = getSafeNextPath(url.searchParams.get("next"), locale);

  if (!code) {
    return NextResponse.redirect(
      new URL(`/${locale}/signup?error=confirmation`, request.url),
    );
  }

  const supabase = await createClient();
  const {error} = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/${locale}/signup?error=confirmation`, request.url),
    );
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
