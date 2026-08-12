import createMiddleware from "next-intl/middleware";
import {type NextRequest, NextResponse} from "next/server";

import {routing} from "@/i18n/routing";
import {updateSession} from "@/lib/supabase/proxy";

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const supabaseResponse = await updateSession(request);
  const response = intlMiddleware(request);

  supabaseResponse.cookies.getAll().forEach(({name, value, ...options}) => {
    response.cookies.set(name, value, options);
  });

  ["cache-control", "expires", "pragma"].forEach((header) => {
    const value = supabaseResponse.headers.get(header);

    if (value) {
      response.headers.set(header, value);
    }
  });

  return response ?? NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|trpc|_vercel|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
