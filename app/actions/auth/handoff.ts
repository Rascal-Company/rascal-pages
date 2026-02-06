"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/src/utils/supabase/server";

export async function handleAuthHandoff(
  accessToken: string,
  refreshToken: string,
) {
  const supabase = await createClient();

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    return { error: error.message };
  }

  // Revalidate and redirect
  revalidatePath("/", "layout");
  redirect("/app/dashboard");
}
