import Link from "next/link";
import { UsersRound } from "lucide-react";
import { createSiteId } from "@/src/lib/types";
import NewCampaignForm from "./NewCampaignForm";
import SnippetBox from "./SnippetBox";
import StatsRow from "./StatsRow";
import { getAppOrigin } from "./app-origin";
import { loadOverlayContext, loadVariantStats, sumStats } from "./overlay-data";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

type CampaignRow = {
  id: string;
  name: string;
  target_origin: string;
  active: boolean;
  overlay_landing_pages: { overlay_variants: { id: string; active: boolean }[] }[];
};

export default async function OverlayPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase, site } = await loadOverlayContext(id);

  const { data } = await supabase
    .from("overlay_campaigns")
    .select(
      "id, name, target_origin, active, overlay_landing_pages(overlay_variants(id, active))",
    )
    .eq("site_id", id)
    .order("created_at", { ascending: false });
  const campaigns = (data ?? []) as unknown as CampaignRow[];

  const stats = await Promise.all(campaigns.map((c) => loadVariantStats(c.id)));
  const snippet = `<script src="${await getAppOrigin()}/overlay/o.js" data-site="${id}"></script>`;

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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-dark">Overlay-kampanjat</h1>
              <p className="mt-2 text-sm text-brand-dark/70">
                Personoi asiakkaan oma sivusto kohderyhmittäin ja testaa variaatioita.
              </p>
            </div>
            <Link
              href={`/app/dashboard/${id}/overlay/profiles`}
              className="inline-flex items-center gap-2 self-start rounded-md border border-brand-dark/20 bg-card px-3 py-1.5 text-sm font-medium text-brand-dark hover:bg-brand-light sm:self-auto"
            >
              <UsersRound className="size-4" aria-hidden />
              Kohderyhmäprofiilit
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-brand-dark/10 bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-brand-dark">Uusi kampanja</h2>
            <p className="mt-1 text-sm text-brand-dark/60">
              Anna kampanjalle nimi ja asiakkaan sivun osoite. Ensimmäinen laskeutumissivu
              ja variaatio luodaan valmiiksi.
            </p>
            <div className="mt-4">
              <NewCampaignForm siteId={createSiteId(site.id)} />
            </div>
          </section>

          {campaigns.length === 0 ? (
            <p className="text-sm text-brand-dark/60">Ei vielä kampanjoita.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {campaigns.map((c, i) => {
                const variants = c.overlay_landing_pages.flatMap((lp) => lp.overlay_variants);
                const live = variants.filter((v) => v.active).length;
                return (
                  <Link
                    key={c.id}
                    href={`/app/dashboard/${id}/overlay/${c.id}`}
                    className="block rounded-lg border border-brand-dark/10 bg-card p-6 shadow-sm transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-brand-dark">{c.name}</p>
                        <p className="truncate text-xs text-brand-dark/60">
                          {c.target_origin.replace(/^https?:\/\//, "")} ·{" "}
                          {c.overlay_landing_pages.length} laskeutumissivua · {live}/
                          {variants.length} variaatiota julkaistu
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.active
                            ? "bg-green-100 text-green-800"
                            : "bg-brand-dark/10 text-brand-dark/70"
                        }`}
                      >
                        {c.active ? "Aktiivinen" : "Pysäytetty"}
                      </span>
                    </div>
                    <div className="mt-4">
                      <StatsRow stats={sumStats(variants.map((v) => stats[i].get(v.id)))} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <SnippetBox snippet={snippet} />
        </div>
      </div>
    </div>
  );
}
