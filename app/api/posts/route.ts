import { NextResponse } from "next/server";
import { createAdminClient } from "@/src/utils/supabase/admin";
import { slugify } from "@/src/lib/posts";

/**
 * Content ingestion endpoint for n8n automation.
 *
 * Auth: send `Authorization: Bearer <POSTS_INGEST_SECRET>`.
 * Upserts a post by (site_id, slug); generates the slug from the title when
 * omitted. Uses the service-role client and therefore bypasses RLS — the
 * shared secret is the only gate, so keep it out of client-side code.
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

function isAuthorized(request: Request): boolean {
  const secret = process.env.POSTS_INGEST_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  return token === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Ei valtuutta." }, { status: 401 });
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

  const supabase = createAdminClient();
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
