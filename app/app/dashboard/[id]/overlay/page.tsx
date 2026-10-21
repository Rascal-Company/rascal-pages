import { createClient } from "@/src/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSiteId } from "@/src/lib/types";
import { getHomeUrl } from "@/app/lib/navigation";
import type { OverlayMatch } from "@/src/lib/overlay";
import NewVariantForm from "./NewVariantForm";
import SnippetBox from "./SnippetBox";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function describeMatch(match: OverlayMatch): string {
  const parts = Object.entries(match)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${v}`);
  return parts.length ? parts.join(" & ") : "Kaikki kävijät";
}

export default async function OverlayPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Tarkista käyttäjä
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(getHomeUrl());
  }

  // 2. Hae käyttäjän organisaatio
  const { data: orgMember } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!orgMember) {
    return <div>Virhe: Organisaatiota ei löydy.</div>;
  }

  // 3. Varmista sivuston omistajuus
  const { data: site } = await supabase
    .from("sites")
    .select("id, subdomain")
    .eq("id", id)
    .eq("user_id", orgMember.org_id)
    .maybeSingle();

  if (!site) {
    redirect("/app/dashboard");
  }

  // 4. Hae variantit
  const { data: variants } = await supabase
    .from("overlay_variants")
    .select("id, name, target_origin, path_pattern, match, changes, active, updated_at")
    .eq("site_id", id)
    .order("updated_at", { ascending: false });

  const headerStore = await headers();
  const host = headerStore.get("host") ?? "app.rascalpages.fi";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const snippet = `<script src="${proto}://${host}/overlay/o.js" data-site="${id}"></script>`;

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/app/dashboard"
            className="mb-4 inline-flex items-center text-sm text-brand-dark/70 hover:text-brand-dark"
          >
            ← Takaisin sivustoihin
          </Link>
          <h1 className="text-3xl font-bold text-brand-dark">Overlay</h1>
          <p className="mt-2 text-sm text-brand-dark/70">
            Personoi asiakkaan oma sivusto mainos- ja kampanjakohtaisesti.
            Muutokset näytetään kävijöille, jotka tulevat kohdennetulla linkillä.
          </p>
        </div>

        <div className="space-y-6">
          <SnippetBox snippet={snippet} />

          <section className="rounded-lg border border-brand-dark/10 bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-brand-dark">Uusi variantti</h2>
            <p className="mt-1 text-sm text-brand-dark/60">
              Anna sivun osoite, jota haluat muokata. Kohdennus asetetaan editorissa.
            </p>
            <div className="mt-4">
              <NewVariantForm siteId={createSiteId(site.id)} />
            </div>
          </section>

          <section className="rounded-lg border border-brand-dark/10 bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-brand-dark">Variantit</h2>
            {!variants?.length ? (
              <p className="mt-4 text-sm text-brand-dark/60">Ei vielä variantteja.</p>
            ) : (
              <ul className="mt-4 divide-y divide-brand-dark/10">
                {variants.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/app/dashboard/${id}/overlay/${v.id}`}
                      className="flex flex-col gap-1 py-3 hover:bg-brand-light sm:flex-row sm:items-center sm:justify-between sm:px-2"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-brand-dark">{v.name}</p>
                        <p className="truncate text-xs text-brand-dark/60">
                          {v.target_origin}
                          {v.path_pattern === "*" ? "/*" : v.path_pattern} ·{" "}
                          {describeMatch(v.match as OverlayMatch)} ·{" "}
                          {(v.changes as unknown[]).length} muutosta
                        </p>
                      </div>
                      <span
                        className={`shrink-0 self-start rounded-full px-2 py-0.5 text-xs font-medium sm:self-auto ${
                          v.active
                            ? "bg-green-100 text-green-800"
                            : "bg-brand-dark/10 text-brand-dark/70"
                        }`}
                      >
                        {v.active ? "Julkaistu" : "Luonnos"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
