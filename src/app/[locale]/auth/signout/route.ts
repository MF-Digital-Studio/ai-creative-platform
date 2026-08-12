import {revalidatePath} from "next/cache";
import {NextResponse, type NextRequest} from "next/server";

import {isSupportedLocale} from "@/i18n/routing";
import {createClient} from "@/lib/supabase/server";

type SignOutContext = {
  params: Promise<{locale: string}>;
};

function redirectTo(request: NextRequest, locale: string, path: string) {
  return NextResponse.redirect(new URL(`/${locale}${path}`, request.url), 303);
}

export async function POST(request: NextRequest, {params}: SignOutContext) {
  const {locale: requestedLocale} = await params;
  const locale = isSupportedLocale(requestedLocale) ? requestedLocale : "tr";
  try {
    const supabase = await createClient();
    const {data: claimsData, error: claimsError} = await supabase.auth.getClaims();

    if (claimsError) {
      return redirectTo(request, locale, "/dashboard");
    }

    if (claimsData?.claims) {
      const {error} = await supabase.auth.signOut({scope: "local"});

      if (error) {
        return redirectTo(request, locale, "/dashboard");
      }
    }
  } catch {
    return redirectTo(request, locale, "/dashboard");
  }

  revalidatePath("/", "layout");

  return redirectTo(request, locale, "");
}

export function GET() {
  return new NextResponse(null, {
    status: 405,
    headers: {Allow: "POST"},
  });
}
