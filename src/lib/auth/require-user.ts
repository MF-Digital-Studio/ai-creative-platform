import {createClient} from "@/lib/supabase/server";

export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {data, error} = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    return !error && typeof userId === "string" && userId.length > 0 ? userId : null;
  } catch {
    return null;
  }
}

export async function hasAuthenticatedUser() {
  return Boolean(await getAuthenticatedUserId());
}
