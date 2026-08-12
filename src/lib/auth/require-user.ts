import {createClient} from "@/lib/supabase/server";

export async function hasAuthenticatedUser() {
  try {
    const supabase = await createClient();
    const {data, error} = await supabase.auth.getClaims();

    return !error && Boolean(data?.claims);
  } catch {
    return false;
  }
}
