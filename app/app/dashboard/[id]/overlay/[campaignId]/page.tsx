import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink, FlaskConical, Hash, PanelsTopLeft, UserRound } from "lucide-react";
import { createSiteId } from "@/src/lib/types";
import { OVERLAY_MATCH_KEYS, createOverlayVariantId, parseMatch } from "@/src/lib/overlay";
import {
  createOverlayCampaignId,
  parseSlotValues,
  type OverlaySlot,
} from "@/src/lib/overlay-campaign";
import { getAppOrigin } from "../app-origin";
import { loadOverlayContext, loadProfiles, loadVariantStats, sumStats } from "../overlay-data";
import SnippetBox from "../SnippetBox";
import StatsRow from "../StatsRow";
import CreateDialog from "../components/CreateDialog";
import StatusPill from "../components/StatusPill";
import CampaignHeader from "./CampaignHeader";
import NewLandingPageForm from "./NewLandingPageForm";
import VariantRow from "./VariantRow";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string; campaignId: string }>;
}

type VariantRowData = {
  id: string;
  created_at: string;
  name: string;
  prompt: string;
  active: boolean;
  slot_values: unknown;
};

type LandingPageRowData = {
  id: string;
  name: string;
  path_pattern: string;
  match: unknown;
  profile_id: string | null;
  slots: OverlaySlot[];
  overlay_variants: VariantRowData[];
};

function Chip({ icon: Icon, children }: { icon: typeof Hash; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      <Icon className="size-3" aria-hidden />
      {children}
    </span>
  );
}

export default async function OverlayCampaignPage({ params }: PageProps) {
  const { id, campaignId } = await params;
  const { supabase, orgId } = await loadOverlayContext(id);

  const { data: campaign } = await supabase
    .from("overlay_campaigns")
    .select("id, name, target_origin, active")
    .eq("id", campaignId)
    .eq("site_id", id)
    .maybeSingle();
  if (!campaign) notFound();

  const { data: landingRows } = await supabase
    .from("overlay_landing_pages")
    .select(
      "id, name, path_pattern, match, profile_id, slots, overlay_variants(id, created_at, name, prompt, active, slot_values)",
    )
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });

  const landingPages = (landingRows ?? []) as unknown as LandingPageRowData[];
  const [profiles, stats, appOrigin] = await Promise.all([
    loadProfiles(supabase, orgId),
    loadVariantStats(campaign.id),
    getAppOrigin(),
  ]);
  const profileName = new Map(profiles.map((p) => [p.id as string, p.name]));
  const snippet = `<script src="${appOrigin}/overlay/o.js" data-site="${id}"></script>`;
  const allVariants = landingPages.flatMap((lp) => lp.overlay_variants);

  const newLandingPage = (
    <CreateDialog
      trigger="Uusi laskeutumissivu"
      title="Uusi laskeutumissivu"
      description="Laskeutumissivu yhdistää sivun, kohdennuksen ja kohderyhmän. Variaatiot jakavat sen liikenteen A/B-testinä."
    >
      <NewLandingPageForm
        siteId={createSiteId(id)}
        campaignId={createOverlayCampaignId(campaign.id)}
        profiles={profiles}
      />
    </CreateDialog>
  );

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/app/dashboard/${id}/overlay`}
          className="-ml-1 mb-6 inline-flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Kampanjat
        </Link>

        <CampaignHeader
          siteId={createSiteId(id)}
          campaignId={createOverlayCampaignId(campaign.id)}
          name={campaign.name}
          targetOrigin={campaign.target_origin}
          active={campaign.active}
        />

        <StatsRow className="mt-6" stats={sumStats(allVariants.map((v) => stats.get(v.id)))} />

        <div className="mb-4 mt-10 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Laskeutumissivut</h2>
          {newLandingPage}
        </div>

        {landingPages.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
            <PanelsTopLeft className="size-6 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-sm text-muted-foreground">Ei vielä laskeutumissivuja.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {landingPages.map((lp) => {
              const match = parseMatch(lp.match);
              const url = new URL(
                lp.path_pattern.includes("*") ? "/" : lp.path_pattern,
                campaign.target_origin,
              );
              for (const key of OVERLAY_MATCH_KEYS) {
                if (match[key]) url.searchParams.set(key, match[key]!);
              }
              const variants = [...lp.overlay_variants].sort((a, b) =>
                a.created_at.localeCompare(b.created_at),
              );
              const live = variants.filter((v) => v.active).length;
              const editorHref = `/app/dashboard/${id}/overlay/${campaign.id}/${lp.id}`;
              const profile = lp.profile_id ? profileName.get(lp.profile_id) : null;

              return (
                <section key={lp.id} className="rounded-2xl border border-border bg-card">
                  <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={editorHref}
                          className="text-base font-semibold tracking-tight hover:underline"
                        >
                          {lp.name}
                        </Link>
                        <StatusPill tone={live > 0 ? "live" : "draft"}>
                          {live}/{variants.length} julkaistu
                        </StatusPill>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {profile && <Chip icon={UserRound}>{profile}</Chip>}
                        {match.utm_term && <Chip icon={Hash}>{match.utm_term}</Chip>}
                        {variants.length > 1 && <Chip icon={FlaskConical}>A/B-testi</Chip>}
                      </div>
                      <a
                        href={url.toString()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex max-w-full items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="size-3 shrink-0" aria-hidden />
                        <span className="truncate">{url.toString()}</span>
                      </a>
                    </div>
                    <Link
                      href={editorHref}
                      className="inline-flex h-8 shrink-0 items-center self-start rounded-md bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90"
                    >
                      Avaa editori
                    </Link>
                  </div>

                  <div className="px-5">
                    <StatsRow stats={sumStats(variants.map((v) => stats.get(v.id)))} />
                  </div>

                  <ul className="mt-4 divide-y divide-border border-t border-border">
                    {variants.map((v) => {
                      const values = parseSlotValues(v.slot_values, lp.slots);
                      const personalized = Object.values(values).filter((value) => value.trim()).length;
                      return (
                        <VariantRow
                          key={v.id}
                          variantId={createOverlayVariantId(v.id)}
                          name={v.name}
                          active={v.active}
                          personalized={personalized}
                          aiPrompt={Boolean(v.prompt.trim())}
                          editorHref={editorHref}
                          stats={stats.get(v.id) ?? { visitors: 0, views: 0, convertedVisitors: 0 }}
                        />
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <SnippetBox snippet={snippet} />
        </div>
      </div>
    </div>
  );
}
