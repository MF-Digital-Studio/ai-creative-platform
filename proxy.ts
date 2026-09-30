import createMiddleware from "next-intl/middleware";
import {type NextRequest, NextResponse} from "next/server";

import {routing} from "@/i18n/routing";
import {updateSession} from "@/lib/supabase/proxy";

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const response = intlMiddleware(request);

  try {
    const supabaseResponse = await updateSession(request);

    supabaseResponse.cookies.getAll().forEach(({name, value, ...options}) => {
      response.cookies.set(name, value, options);
    });

    ["cache-control", "expires", "pragma"].forEach((header) => {
      const value = supabaseResponse.headers.get(header);

      if (value) {
        response.headers.set(header, value);
      }
    });
  } catch (error) {
    // A temporary auth outage must not make public pages unavailable. Protected
    // routes still verify the session in their server components.
    console.error("Unable to refresh the Supabase session in proxy.", error);
  }

  return response ?? NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|trpc|_vercel|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
