"use server";

import { createClient } from "@/src/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateApiKey } from "@/src/lib/api-keys";

export type ApiKeySummary = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

type CreateResult =
  | { success: true; raw: string; key: ApiKeySummary }
  | { success: false; error: string };

type MutateResult = { success: true } | { success: false; error: string };

/**
 * Resolve the caller's organization, or an error result. Centralizes the
 * auth → org_members lookup shared by every key action.
 */
async function resolveOrgId(
  supabase: SupabaseClient,
): Promise<{ orgId: string } | { error: string }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Sinun täytyy olla kirjautunut sisään." };
  }

  const { data: orgMember } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!orgMember) return { error: "Käyttäjätiliä ei löydy." };
  return { orgId: orgMember.org_id };
}

export async function createApiKeyCore(
  client: SupabaseClient,
  orgId: string,
  name: string,
): Promise<CreateResult> {
  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Anna avaimelle nimi." };

  const { raw, prefix, hash } = generateApiKey();
  const { data, error } = await client
    .from("api_keys")
    .insert({
      org_id: orgId,
      name: trimmed,
      key_hash: hash,
      key_prefix: prefix,
    })
    .select("id, name, key_prefix, created_at, last_used_at, revoked_at")
    .single();

  if (error || !data) {
    console.error("Virhe API-avaimen luonnissa:", error);
    return { success: false, error: "Avaimen luonti epäonnistui." };
  }

  return {
    success: true,
    raw,
    key: {
      id: data.id,
      name: data.name,
      keyPrefix: data.key_prefix,
      createdAt: data.created_at,
      lastUsedAt: data.last_used_at,
      revokedAt: data.revoked_at,
    },
  };
}

export async function revokeApiKeyCore(
  client: SupabaseClient,
  orgId: string,
  keyId: string,
): Promise<MutateResult> {
  const { error } = await client
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("org_id", orgId);

  if (error) {
    console.error("Virhe API-avaimen peruutuksessa:", error);
    return { success: false, error: "Avaimen peruutus epäonnistui." };
  }
  return { success: true };
}

export async function createApiKey(
  siteId: string,
  name: string,
): Promise<CreateResult> {
  const supabase = await createClient();
  const org = await resolveOrgId(supabase);
  if ("error" in org) return { success: false, error: org.error };

  const result = await createApiKeyCore(supabase, org.orgId, name);
  if (result.success) revalidatePath(`/app/dashboard/${siteId}/settings`);
  return result;
}

export async function revokeApiKey(
  siteId: string,
  keyId: string,
): Promise<MutateResult> {
  const supabase = await createClient();
  const org = await resolveOrgId(supabase);
  if ("error" in org) return { success: false, error: org.error };

  const result = await revokeApiKeyCore(supabase, org.orgId, keyId);
  if (result.success) revalidatePath(`/app/dashboard/${siteId}/settings`);
  return result;
}
