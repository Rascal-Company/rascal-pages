import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/app/dashboard/${id}/overlay`}
          className="mb-4 inline-flex items-center text-sm text-brand-dark/70 hover:text-brand-dark"
        >
          ← Kampanjat
        </Link>

        <div className="space-y-6">
          <CampaignHeader
            siteId={createSiteId(id)}
            campaignId={createOverlayCampaignId(campaign.id)}
            name={campaign.name}
            targetOrigin={campaign.target_origin}
            active={campaign.active}
          />

          <section className="rounded-lg border border-brand-dark/10 bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-brand-dark">Uusi laskeutumissivu</h2>
            <p className="mt-1 text-sm text-brand-dark/60">
              Laskeutumissivu = sivu + kohdennus + kohderyhmäprofiili. Sen alle tehdään
              variaatiot, jotka jakavat liikenteen A/B-testinä.
            </p>
            <div className="mt-4">
              <NewLandingPageForm
                siteId={createSiteId(id)}
                campaignId={createOverlayCampaignId(campaign.id)}
                profiles={profiles}
              />
            </div>
          </section>

          {landingPages.length === 0 && (
            <p className="text-sm text-brand-dark/60">Ei vielä laskeutumissivuja.</p>
          )}

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
              <section
                key={lp.id}
                className="rounded-lg border border-brand-dark/10 bg-card p-6 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      href={editorHref}
                      className="text-lg font-semibold text-brand-dark hover:underline"
                    >
                      {lp.name}
                    </Link>
                    <a
                      href={url.toString()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 truncate text-xs text-brand-dark/60 hover:text-brand-dark"
                    >
                      <ExternalLink className="size-3 shrink-0" aria-hidden />
                      <span className="truncate">{url.toString()}</span>
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-1 text-xs">
                    {variants.length > 1 && (
                      <span className="rounded-full bg-brand-light px-2 py-0.5 text-brand-dark/80">
                        A/B-testi
                      </span>
                    )}
                    {match.utm_term && (
                      <span className="rounded-full bg-brand-light px-2 py-0.5 text-brand-dark/80">
                        # {match.utm_term}
                      </span>
                    )}
                    {profile && (
                      <span className="rounded-full bg-brand-light px-2 py-0.5 text-brand-dark/80">
                        {profile}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        live > 0 ? "bg-green-100 text-green-800" : "bg-brand-dark/10 text-brand-dark/70"
                      }`}
                    >
                      {live}/{variants.length} julkaistu
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <StatsRow stats={sumStats(variants.map((v) => stats.get(v.id)))} />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-brand-dark">Variaatiot</h3>
                  <Link
                    href={editorHref}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Avaa editori
                  </Link>
                </div>
                <ul className="mt-2 space-y-2">
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

          <SnippetBox snippet={snippet} />
        </div>
      </div>
    </div>
  );
}

