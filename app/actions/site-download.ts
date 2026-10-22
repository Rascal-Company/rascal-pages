"use server";

import { nanoid } from "nanoid";
import { createClient } from "@/src/utils/supabase/server";
import {
  DOWNLOAD_BUCKET,
  DOWNLOAD_KINDS,
  DOWNLOAD_MAX_BYTES,
  DOWNLOAD_MIME_TYPES,
  downloadPath,
  type DownloadKind,
} from "@/src/lib/site-downloads";
import type { SiteId } from "@/src/lib/types";

export type PrepareDownloadResult = { path: string; token: string } | { error: string };

/**
 * Valmistelee ladattavan tiedoston latauksen (RAS-1115). Tiedosto on liian
 * suuri server actionin rungoksi, joten palvelin tarkistaa omistajuuden ja
 * antaa allekirjoitetun upload-linkin, jolla selain lataa tiedoston suoraan
 * Storageen.
 */
export async function prepareSiteDownloadUpload(
  siteId: SiteId,
  input: { fileName: string; size: number; type: string; kind: DownloadKind },
): Promise<PrepareDownloadResult> {
  if (!DOWNLOAD_KINDS.includes(input.kind)) return { error: "Virheellinen pyyntö." };
  if (!(input.size > 0)) return { error: "Tiedosto on tyhjä." };
  if (input.size > DOWNLOAD_MAX_BYTES) return { error: "Tiedosto on liian suuri (enintään 25 Mt)." };
  if (!DOWNLOAD_MIME_TYPES.has(input.type)) {
    return { error: "Tiedostotyyppiä ei tueta. Käytä PDF-, ZIP-, Office-, CSV- tai kuvatiedostoa." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sinun täytyy olla kirjautunut sisään." };

  const { data: orgMember } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!orgMember) return { error: "Käyttäjätiliä ei löydy." };

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("user_id", orgMember.org_id)
    .maybeSingle();
  if (!site) return { error: "Sivustoa ei löydy tai sinulla ei ole oikeuksia." };

  const path = downloadPath(orgMember.org_id, siteId, input.kind, input.fileName, nanoid(10));
  const { data, error } = await supabase.storage.from(DOWNLOAD_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("Virhe latauksen valmistelussa:", error);
    return { error: "Tiedoston lataus epäonnistui. Yritä uudelleen." };
  }
  return { path, token: data.token };
}
