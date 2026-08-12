"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUserId } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";

export type UpdateProfileState = {
  status: "idle" | "success" | "error" | "validation";
};

export async function updateDisplayName(
  _previousState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { status: "error" };
  }

  const displayName = formData.get("display_name");
  if (typeof displayName !== "string") {
    return { status: "error" };
  }

  const normalizedDisplayName = displayName.trim();
  if (Array.from(normalizedDisplayName).length > 80) {
    return { status: "validation" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: normalizedDisplayName || null })
      .eq("id", userId);

    if (error) {
      return { status: "error" };
    }
  } catch {
    return { status: "error" };
  }

  revalidatePath("/[locale]/dashboard/account", "page");

  return { status: "success" };
}
