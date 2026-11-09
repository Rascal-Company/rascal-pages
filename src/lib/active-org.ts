import type { SupabaseClient } from "@supabase/supabase-js";
import type { Brand } from "./types";

/**
 * Monibrändi (RAS-1326): minkä organisaation (public.users-rivi) kontekstissa
 * Pages käsittelee pyynnön, kun käyttäjä kuuluu useaan orgiin.
 *
 * Sama järjestys kuin Rascal AI:ssa (`_lib/active-membership.js`), ja valinta
 * luetaan samasta `user_active_org`-taulusta — brändi pysyy samana tuotteesta
 * toiseen siirryttäessä. Valinta on pelkkä toive: oikeus tulee aina
 * org_members-jäsenyydestä.
 */

export type OrgId = Brand<string, "OrgId">;

export type Membership = {
  org_id: OrgId;
  role: string | null;
  impersonating_from_org_id?: string | null;
};

const ROLE_PRIORITY: Record<string, number> = {
  owner: 3,
  admin: 2,
  moderator: 1,
  member: 0,
};

const PAGES_SLUG = "rascal-pages";

function rolePriority(role: string | null): number {
  return ROLE_PRIORITY[role ?? ""] ?? 0;
}

/**
 * Valitsee aktiivisen jäsenyyden. Puhdas funktio — ei kantaa.
 *
 * 1. Impersonointi voittaa (se mutatoi org_members.org_id:tä).
 * 2. Käyttäjän valinta, jos hän on yhä jäsen eikä Pagesia ole siinä rajattu.
 * 3. Muuten rajaamaton org ennen rajattua, sitten korkein rooli, tasatilanteessa
 *    org_id — sama tulos joka kerta.
 */
export function pickActiveMembership(
  memberships: readonly Membership[],
  activeOrgId: string | null,
  restrictedOrgIds: ReadonlySet<string> = new Set(),
): Membership | null {
  if (memberships.length === 0) return null;

  const impersonating = memberships.find((m) => m.impersonating_from_org_id);
  if (impersonating) return impersonating;

  if (activeOrgId && !restrictedOrgIds.has(activeOrgId)) {
    const chosen = memberships.find((m) => m.org_id === activeOrgId);
    if (chosen) return chosen;
  }

  return [...memberships].sort((a, b) => {
    const ra = restrictedOrgIds.has(a.org_id) ? 1 : 0;
    const rb = restrictedOrgIds.has(b.org_id) ? 1 : 0;
    if (ra !== rb) return ra - rb;
    const byRole = rolePriority(b.role) - rolePriority(a.role);
    if (byRole !== 0) return byRole;
    return String(a.org_id).localeCompare(String(b.org_id));
  })[0];
}

type RestrictionRow = {
  organization_products: { org_id: string; products: { slug: string } | null } | null;
};

/** Orgit, joissa käyttäjällä on tuoterajaus mutta ei Pagesia (org_member_products). */
export function orgsWithoutPagesAccess(rows: readonly RestrictionRow[] | null): Set<string> {
  const slugsByOrg = new Map<string, Set<string>>();
  for (const row of rows ?? []) {
    const op = row.organization_products;
    if (!op?.org_id) continue;
    const slugs = slugsByOrg.get(op.org_id) ?? new Set<string>();
    if (op.products?.slug) slugs.add(op.products.slug);
    slugsByOrg.set(op.org_id, slugs);
  }
  return new Set(
    [...slugsByOrg].filter(([, slugs]) => !slugs.has(PAGES_SLUG)).map(([org]) => org),
  );
}

export type ActiveOrg = {
  orgId: OrgId;
  role: string | null;
  memberships: Membership[];
};

/**
 * Hakee auth-käyttäjän aktiivisen orgin. Palauttaa null, jos käyttäjä ei kuulu
 * mihinkään orgiin. Toimii sekä käyttäjän (RLS) että service role -clientilla.
 */
export async function resolveActiveOrg(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<ActiveOrg | null> {
  const [members, active] = await Promise.all([
    supabase
      .from("org_members")
      .select("org_id, role, impersonating_from_org_id")
      .eq("auth_user_id", authUserId)
      .eq("active", true),
    supabase.from("user_active_org").select("org_id").eq("auth_user_id", authUserId).maybeSingle(),
  ]);

  if (members.error) {
    console.error("[active-org] org_members read failed:", members.error.message);
    return null;
  }
  const memberships = (members.data ?? []) as Membership[];
  if (memberships.length === 0) return null;

  let restricted = new Set<string>();
  if (memberships.length > 1) {
    const { data, error } = await supabase
      .from("org_member_products")
      .select("organization_products!inner(org_id, products!inner(slug))")
      .eq("auth_user_id", authUserId);
    // Kyselyvirhe ei estä: valinta palaa roolijärjestykseen ja layoutin
    // tuotetarkistus estää silti orgin, jossa Pagesia ei ole.
    if (error) console.warn("[active-org] org_member_products read failed:", error.message);
    else restricted = orgsWithoutPagesAccess(data as unknown as RestrictionRow[]);
  }

  // Valinnan lukuvirhe ei kaada pyyntöä: palataan oletusjärjestykseen.
  const activeOrgId = active.error ? null : (active.data?.org_id ?? null);
  const picked = pickActiveMembership(memberships, activeOrgId, restricted);
  if (!picked) return null;
  return { orgId: picked.org_id, role: picked.role, memberships };
}

/** Lyhyt muoto kutsupaikoille, jotka tarvitsevat vain org_id:n. */
export async function resolveActiveOrgId(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<OrgId | null> {
  return (await resolveActiveOrg(supabase, authUserId))?.orgId ?? null;
}

/**
 * Pudotettava korvaaja vanhalle `org_members … .maybeSingle()` -haulle:
 * palauttaa saman muotoisen rivin, jotta kutsupaikat lukevat yhä `org_id`:tä.
 */
export async function getActiveOrgMember(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<{ org_id: OrgId; role: string | null } | null> {
  const active = await resolveActiveOrg(supabase, authUserId);
  return active ? { org_id: active.orgId, role: active.role } : null;
}
