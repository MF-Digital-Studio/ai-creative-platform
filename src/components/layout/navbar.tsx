import {createClient} from "@/lib/supabase/server";

import {NavbarClient} from "@/components/layout/navbar-client";

export async function Navbar() {
  let isAuthenticated = false;

  try {
    const supabase = await createClient();
    const {data, error} = await supabase.auth.getClaims();
    isAuthenticated = !error && Boolean(data?.claims);
  } catch {
    isAuthenticated = false;
  }

  return <NavbarClient isAuthenticated={isAuthenticated} />;
}
