import { NextResponse } from "next/server";
import { createAdminClient } from "@/src/utils/supabase/admin";
import {
  buildPortfolioConfig,
  suggestSubdomain,
  type PortfolioInterviewAnswers,
} from "@/src/lib/portfolio-interview";

/**
 * Portfolio interview → site builder endpoint for n8n automation.
 *
 * Auth: send `Authorization: Bearer <PORTFOLIO_INTERVIEW_SECRET>`.
 * After the ElevenLabs voice interview, n8n POSTs the collected answers plus
 * the caller's identity here. We map the answers to a portfolio TemplateConfig
 * (single source of truth in `portfolio-interview.ts`), then create the site
 * and its home page with the service-role client. The shared secret is the
 * only gate, so keep it out of client-side code.
 */

type RequestBody = {
  authUserId?: string;
  orgId?: string;
  subdomain?: string;
  published?: boolean;
  answers?: PortfolioInterviewAnswers;
};

function isAuthorized(request: Request): boolean {
  const secret = process.env.PORTFOLIO_INTERVIEW_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  return token === secret;
}

const ALPHANUMERIC = /^[a-zA-Z0-9]+$/;

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Find an available alphanumeric subdomain, starting from `base` and appending
 * a numeric suffix on collision.
 */
async function resolveSubdomain(
  supabase: AdminClient,
  base: string,
): Promise<string | null> {
  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = attempt === 0 ? base : `${base}${attempt + 1}`;
    const { data, error } = await supabase
      .from("sites")
      .select("id")
      .eq("subdomain", candidate)
      .limit(1);
    if (error) return null;
    if (!data || data.length === 0) return candidate;
  }
  return null;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Ei valtuutta." }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Virheellinen JSON." }, { status: 400 });
  }

  const answers = body.answers;
  if (!answers || !answers.name || !answers.story) {
    return NextResponse.json(
      { error: "answers.name ja answers.story ovat pakollisia." },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  // Resolve the owning organization (public.users.id).
  let orgId = body.orgId ?? null;
  if (!orgId && body.authUserId) {
    const { data: orgMember, error } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("auth_user_id", body.authUserId)
      .maybeSingle();
    if (error || !orgMember) {
      return NextResponse.json(
        { error: "Organisaatiota ei löytynyt käyttäjälle." },
        { status: 404 },
      );
    }
    orgId = orgMember.org_id;
  }

  if (!orgId) {
    return NextResponse.json(
      { error: "orgId tai authUserId on pakollinen." },
      { status: 400 },
    );
  }

  // Determine a free subdomain.
  const requested = body.subdomain?.trim();
  const base =
    requested && ALPHANUMERIC.test(requested)
      ? requested.toLowerCase()
      : suggestSubdomain(answers.name);
  const subdomain = await resolveSubdomain(supabase, base);
  if (!subdomain) {
    return NextResponse.json(
      { error: "Vapaata subdomainia ei löytynyt." },
      { status: 409 },
    );
  }

  const content = buildPortfolioConfig(answers);

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .insert({ user_id: orgId, subdomain, custom_domain: null, settings: {} })
    .select("id")
    .single();

  if (siteError || !site) {
    console.error("Virhe sivuston luonnissa:", siteError);
    return NextResponse.json(
      { error: "Sivuston luominen epäonnistui." },
      { status: 500 },
    );
  }

  const { error: pageError } = await supabase.from("pages").insert({
    site_id: site.id,
    slug: "home",
    title: "Etusivu",
    content,
    published: body.published ?? false,
  });

  if (pageError) {
    console.error("Virhe sivun luonnissa:", pageError);
    return NextResponse.json(
      { error: "Sivun luominen epäonnistui." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { success: true, siteId: site.id, subdomain },
    { status: 200 },
  );
}
