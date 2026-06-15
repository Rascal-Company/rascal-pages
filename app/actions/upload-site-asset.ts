"use server";

import { nanoid } from "nanoid";
import { createClient } from "@/src/utils/supabase/server";
import type { SiteId } from "@/src/lib/types";

const BUCKET = "site-assets";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
]);

export type UploadResult = { url: string } | { error: string };

/**
 * Upload an image for a site to the `site-assets` storage bucket and return its
 * public URL. Verifies the caller owns the site; objects are stored under
 * `${org_id}/${siteId}/...` to satisfy the bucket's org-scoped RLS policies.
 */
export async function uploadSiteAsset(
  siteId: SiteId,
  formData: FormData,
): Promise<UploadResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Tiedostoa ei löytynyt." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Kuva on liian suuri (enintään 5 Mt)." };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return { error: "Vain kuvatiedostot ovat sallittuja." };
  }

  const supabase = await createClient();

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
  if (!orgMember) {
    return { error: "Käyttäjätiliä ei löydy." };
  }

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("user_id", orgMember.org_id)
    .maybeSingle();
  if (!site) {
    return { error: "Sivustoa ei löydy tai sinulla ei ole oikeuksia." };
  }

  const extension =
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `${orgMember.org_id}/${siteId}/${nanoid(12)}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });
  if (uploadError) {
    console.error("Virhe kuvan latauksessa:", uploadError);
    return { error: "Kuvan lataus epäonnistui. Yritä uudelleen." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { url: publicUrl };
}
