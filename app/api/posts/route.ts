import { NextResponse } from "next/server";
import { createAdminClient } from "@/src/utils/supabase/admin";
import { slugify } from "@/src/lib/posts";
import { hashApiKey, isApiKeyFormat } from "@/src/lib/api-keys";

/**
 * Content ingestion endpoint for automated blog publishing.
 *
 * Two auth paths, both via `Authorization: Bearer <token>`:
 *   1. First-party global secret (`POSTS_INGEST_SECRET`) — may write to ANY
 *      site. Used by Rascal AI's own n8n automation.
 *   2. Org-scoped API key (`rp_live_…`) — may write only to sites owned by the
 *      key's organization. Handed out to standalone customers.
 *
 * Upserts a post by (site_id, slug); generates the slug from the title when
 * omitted. Uses the service-role client and therefore bypasses RLS — auth is
 * enforced here, so keep tokens out of client-side code.
 */

type IngestBody = {
  siteId?: string;
  slug?: string;
  title?: string;
  content?: string;
  excerpt?: string;
  coverImage?: string;
  published?: boolean;
  publishedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
};

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Result of resolving the bearer token. `orgId === null` means a first-party
 * caller that may write to any site; a string restricts writes to that org.
 */
type AuthResult =
  | { ok: true; orgId: string | null }
  | { ok: false; status: number };

function extractBearer(request: Request): string {
  const header = request.headers.get("authorization") ?? "";
  return header.replace(/^Bearer\s+/i, "").trim();
}

async function resolveAuth(
  request: Request,
  supabase: AdminClient,
): Promise<AuthResult> {
  const token = extractBearer(request);
  if (!token) return { ok: false, status: 401 };

  const globalSecret = process.env.POSTS_INGEST_SECRET;
  if (globalSecret && token === globalSecret) {
    return { ok: true, orgId: null };
  }

  if (!isApiKeyFormat(token)) {
    return { ok: false, status: 401 };
  }

  const { data: key } = await supabase
    .from("api_keys")
    .select("id, org_id")
    .eq("key_hash", hashApiKey(token))
    .is("revoked_at", null)
    .maybeSingle();

  if (!key) return { ok: false, status: 401 };

  // Best-effort usage timestamp; failure here must not block ingestion.
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", key.id);

  return { ok: true, orgId: key.org_id };
}

export async function POST(request: Request) {
  const supabase = createAdminClient();

  const auth = await resolveAuth(request, supabase);
  if (!auth.ok) {
    return NextResponse.json(
      { error: "Ei valtuutta." },
      { status: auth.status },
    );
  }

  let body: IngestBody;
  try {
    body = (await request.json()) as IngestBody;
  } catch {
    return NextResponse.json({ error: "Virheellinen JSON." }, { status: 400 });
  }

  if (!body.siteId || !body.title) {
    return NextResponse.json(
      { error: "siteId ja title ovat pakollisia." },
      { status: 400 },
    );
  }

  // Org-scoped keys may only write to sites they own.
  if (auth.orgId !== null) {
    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("id", body.siteId)
      .eq("user_id", auth.orgId)
      .maybeSingle();
    if (!site) {
      return NextResponse.json(
        { error: "Sivustoa ei löydy tältä organisaatiolta." },
        { status: 403 },
      );
    }
  }

  const slug = body.slug ? slugify(body.slug) : slugify(body.title);
  if (!slug) {
    return NextResponse.json(
      { error: "Otsikosta ei voitu muodostaa slugia." },
      { status: 400 },
    );
  }

  const published = body.published ?? true;
  const publishedAt =
    published && !body.publishedAt
      ? new Date().toISOString()
      : (body.publishedAt ?? null);

  const { data, error } = await supabase
    .from("posts")
    .upsert(
      {
        site_id: body.siteId,
        slug,
        title: body.title,
        content: body.content ?? "",
        excerpt: body.excerpt ?? null,
        cover_image: body.coverImage ?? null,
        published,
        published_at: publishedAt,
        seo_title: body.seoTitle ?? null,
        seo_description: body.seoDescription ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "site_id,slug" },
    )
    .select()
    .single();

  if (error) {
    console.error("Virhe postauksen tallennuksessa:", error);
    return NextResponse.json(
      { error: "Postauksen tallennus epäonnistui." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, post: data }, { status: 200 });
}
