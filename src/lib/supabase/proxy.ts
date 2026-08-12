import {createServerClient} from "@supabase/ssr";
import {NextResponse, type NextRequest} from "next/server";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase environment is incomplete. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return {url, publishableKey};
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({request});
  const {url, publishableKey} = getSupabaseEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({name, value}) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({request});

        cookiesToSet.forEach(({name, value, options}) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([name, value]) => {
          supabaseResponse.headers.set(name, value);
        });
      },
    },
  });

  await supabase.auth.getClaims();

  return supabaseResponse;
}
