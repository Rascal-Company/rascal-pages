import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/src/utils/supabase/admin";
import { isValidUuid } from "@/src/lib/types";
import { RateLimiter } from "@/src/lib/rate-limit";
import {
  DOWNLOAD_BUCKET,
  PUBLIC_LINK_SECONDS,
  downloadFileName,
  isSiteDownloadPath,
} from "@/src/lib/site-downloads";

/**
 * Painikkeen suora lataus: /api/download?s=SIVUSTO&f=POLKU (RAS-1115).
 * Tiedostot ovat yksityisessä bucketissa; tämä ohjaa minuutin voimassa
 * olevaan allekirjoitettuun linkkiin. Vain sivuston public-tiedostot —
 * lomakkeen lahjat saa vain lomakkeen kautta.
 */
const downloadLimiter = new RateLimiter({ maxRequests: 60, windowMs: 15 * 60 * 1000 });

function notFound() {
  return new NextResponse("Tiedostoa ei löydy.", { status: 404 });
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!downloadLimiter.check(ip).allowed) {
    return new NextResponse("Liian monta pyyntöä. Yritä hetken päästä uudelleen.", { status: 429 });
  }

  const siteId = req.nextUrl.searchParams.get("s") ?? "";
  const path = req.nextUrl.searchParams.get("f") ?? "";
  if (!isValidUuid(siteId) || !path) return notFound();

  const admin = createAdminClient();
  const { data: site } = await admin.from("sites").select("user_id").eq("id", siteId).maybeSingle();
  if (!site || !isSiteDownloadPath(path, site.user_id as string, siteId, "public")) return notFound();

  const { data, error } = await admin.storage
    .from(DOWNLOAD_BUCKET)
    .createSignedUrl(path, PUBLIC_LINK_SECONDS, { download: downloadFileName(path) });
  if (error || !data) return notFound();

  return NextResponse.redirect(data.signedUrl, {
    status: 302,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
