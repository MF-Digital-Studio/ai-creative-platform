"use server";

import {revalidatePath} from "next/cache";

import {isSupportedLocale, type AppLocale} from "@/i18n/routing";
import {getAuthenticatedUserId} from "@/lib/auth/require-user";
import {createClient} from "@/lib/supabase/server";

export type CreateProjectState = {
  status: "idle" | "error";
};

export async function createProject(
  locale: AppLocale,
  previousState: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  void previousState;
  void formData;

  const userId = await getAuthenticatedUserId();
  if (!userId || !isSupportedLocale(locale)) {
    return {status: "error"};
  }

  try {
    const supabase = await createClient();
    const {error} = await supabase.from("projects").insert({user_id: userId});

    if (error) {
      return {status: "error"};
    }
  } catch {
    return {status: "error"};
  }

  revalidatePath(`/${locale}/dashboard`, "page");

  return {status: "idle"};
}
