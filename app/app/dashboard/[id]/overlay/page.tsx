import Link from "next/link";
import { ChevronLeft, ChevronRight, Layers, UsersRound } from "lucide-react";
import { createSiteId } from "@/src/lib/types";
import NewCampaignForm from "./NewCampaignForm";
import SnippetBox from "./SnippetBox";
import StatsRow from "./StatsRow";
import CreateDialog from "./components/CreateDialog";
import StatusPill from "./components/StatusPill";
import { getAppOrigin } from "./app-origin";
import { loadOverlayContext, loadPagesTargets, loadVariantStats, sumStats } from "./overlay-data";

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
  const { supabase, orgId, site } = await loadOverlayContext(id);

  const { data } = await supabase
    .from("overlay_campaigns")
    .select(
      "id, name, target_origin, active, overlay_landing_pages(overlay_variants(id, active))",
    )
    .eq("site_id", id)
    .order("created_at", { ascending: false });
  const campaigns = (data ?? []) as unknown as CampaignRow[];

  const [stats, pagesTargets] = await Promise.all([
    Promise.all(campaigns.map((c) => loadVariantStats(c.id))),
    loadPagesTargets(supabase, orgId),
  ]);
  const pagesOrigins = new Set(pagesTargets.map((t) => t.origin));
  // Snippetti tarvitaan vain ulkoisille sivustoille.
  const needsSnippet = campaigns.length === 0 || campaigns.some((c) => !pagesOrigins.has(c.target_origin));
  const snippet = `<script src="${await getAppOrigin()}/overlay/o.js" data-site="${id}"></script>`;

  const newCampaign = (
    <CreateDialog
      trigger="Uusi kampanja"
      title="Uusi kampanja"
      description="Kampanja on oma Pages-sivu tai asiakkaan sivusto. Ensimmäinen laskeutumissivu ja variaatio luodaan valmiiksi."
    >
      <NewCampaignForm siteId={createSiteId(site.id)} pagesTargets={pagesTargets} />
    </CreateDialog>
  );

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/app/dashboard"
          className="-ml-1 mb-6 inline-flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Sivustot
        </Link>

        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight">Overlay-kampanjat</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Personoi asiakkaan oma sivusto kohderyhmittäin ja testaa variaatioita.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/app/dashboard/audiences"
              className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-card px-3 text-xs font-medium hover:bg-muted"
            >
              <UsersRound className="size-4" aria-hidden />
              Kohderyhmät
            </Link>
            {newCampaign}
          </div>
        </header>

        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
              <Layers className="size-6" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-semibold">Ensimmäinen kampanja</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Anna asiakkaan sivun osoite, klikkaa muutettavat elementit ja anna AI:n kirjoittaa
              tekstit kohderyhmälle.
            </p>
            <div className="mt-6">{newCampaign}</div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {campaigns.map((c, i) => {
              const variants = c.overlay_landing_pages.flatMap((lp) => lp.overlay_variants);
              const live = variants.filter((v) => v.active).length;
              return (
                <Link
                  key={c.id}
                  href={`/app/dashboard/${id}/overlay/${c.id}`}
                  className="group rounded-2xl border border-border bg-card p-5 transition-[border-color,box-shadow,transform] hover:border-foreground/15 hover:shadow-md active:scale-[0.99] motion-reduce:active:scale-100"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold tracking-tight">{c.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {pagesOrigins.has(c.target_origin) && "Pages · "}
                        {c.target_origin.replace(/^https?:\/\//, "")}
                      </p>
                    </div>
                    <StatusPill tone={!c.active ? "paused" : live > 0 ? "live" : "draft"}>
                      {!c.active ? "Pysäytetty" : live > 0 ? "Käynnissä" : "Luonnos"}
                    </StatusPill>
                  </div>
                  <StatsRow
                    className="mt-4"
                    stats={sumStats(variants.map((v) => stats[i].get(v.id)))}
                  />
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {c.overlay_landing_pages.length} laskeutumissivua · {live}/{variants.length}{" "}
                      variaatiota julkaistu
                    </span>
                    <ChevronRight
                      className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                      aria-hidden
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {needsSnippet && (
          <div className="mt-8">
            <SnippetBox snippet={snippet} />
          </div>
        )}
      </div>
    </div>
  );
}
