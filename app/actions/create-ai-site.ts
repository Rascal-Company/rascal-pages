"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/utils/supabase/server";

type CreateAiSiteInput = {
  title: string;
  description: string;
  link: string;
};

type CreateAiSiteResult = {
  success: boolean;
  error?: string;
};

export async function createAiSite(
  input: CreateAiSiteInput,
): Promise<CreateAiSiteResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Ei kirjautunut käyttäjä" };
  }

  const { data: orgMember } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!orgMember) {
    return { success: false, error: "Organisaatiota ei löydy" };
  }

  const webhookUrl = process.env.N8N_LANDINGPAGE_BUILDER;
  if (!webhookUrl) {
    return {
      success: false,
      error: "Webhook URL puuttuu (N8N_LANDINGPAGE_BUILDER)",
    };
  }

  try {
    const payload = {
      title: input.title,
      description: input.description,
      link: input.link,
      userId: user.id,
      orgId: orgMember.org_id,
      userEmail: user.email,
    };

    console.log("🔍 AI Site Creation - Sending to webhook:", webhookUrl);
    console.log("🔍 Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("🔍 Webhook response status:", response.status);
    console.log("🔍 Webhook response statusText:", response.statusText);

    // Try to read response body for debugging
    const responseText = await response.text();
    console.log("🔍 Webhook response body:", responseText);

    if (!response.ok) {
      return {
        success: false,
        error: `Webhook-pyyntö epäonnistui: ${response.statusText} - ${responseText.substring(0, 200)}`,
      };
    }

    // Revalidate dashboard to show new site
    revalidatePath("/app/dashboard");

    return { success: true };
  } catch (error) {
    console.error("🔍 Virhe AI-sivun luonnissa:", error);
    return { success: false, error: "Odottamaton virhe tapahtui" };
  }
}
