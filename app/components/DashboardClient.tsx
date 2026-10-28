"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CircleCheck, Eye, Globe, Inbox, Search, Target, UsersRound } from "lucide-react";
import { createClient } from "@/src/utils/supabase/client";
import LoginModal from "./LoginModal";
import CreateAiSiteModal from "./CreateAiSiteModal";
import NewSiteMenu from "./NewSiteMenu";
import SiteRow, { SITE_ROW_GRID, type DashboardSite } from "./dashboard/SiteRow";
import KpiTile from "./dashboard/KpiTile";
import { KPI_PERIOD_DAYS, conversionPercent, percentChange, sumKpis } from "@/src/lib/kpi";
import { cn } from "@/src/lib/utils";
import { SITE_KINDS, type SiteKind } from "@/src/lib/site-kind";
import SegmentedControl from "@/app/components/ui/segmented-control";

const GROUP_LABELS: Record<SiteKind, string> = {
  lander: "Landerit",
  portfolio: "Portfoliot",
  overlay: "Overlay",
};
import { useRouter } from "next/navigation";
import { togglePagePublish } from "@/app/actions/toggle-publish";
import { deleteSite } from "@/app/actions";
import { useToast } from "@/app/components/ui/ToastContainer";
import ThemeToggle from "@/app/components/ThemeToggle";
import { createSiteId } from "@/src/lib/types";
import { AccountMenu } from "./AccountMenu";
import PublishPlanDialog from "./billing/PublishPlanDialog";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useMutation } from "@tanstack/react-query";

type Site = DashboardSite & {
  user_id: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

interface DashboardClientProps {
  initialSites: Site[];
  userId: string | null;
}

export default function DashboardClient({
  initialSites,
  userId,
}: DashboardClientProps) {
  const { showToast, showConfirm } = useToast();
  const [sites, setSites] = useState(initialSites);
  // Ilman palvelimen validoimaa käyttäjää login-modaali on auki heti.
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(!userId);
  const [isAuthenticated, setIsAuthenticated] = useState(!!userId);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<"all" | SiteKind>("all");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const router = useRouter();
  // Julkaisun maksu (RAS-1170): sivusto, jonka julkaisu vaatii tilauksen.
  const [planSiteId, setPlanSiteId] = useState<string | null>(null);

  const togglePublishMutation = useMutation({
    mutationFn: (params: { siteId: string; published: boolean }) =>
      togglePagePublish(createSiteId(params.siteId), params.published),
    onSuccess: (result, variables) => {
      if (!result?.error) {
        setSites((prev) =>
          prev.map((site) =>
            site.id === variables.siteId
              ? { ...site, published: variables.published }
              : site,
          ),
        );
        showToast(
          variables.published ? "Sivu julkaistu" : "Sivu piilotettu",
          "success",
        );
      } else if (result.code === "PAYMENT_REQUIRED") {
        setPlanSiteId(variables.siteId);
      } else {
        showToast(result.error, "error");
      }
    },
    onError: () => {
      showToast("Julkaisutilan päivitys epäonnistui.", "error");
    },
  });

  const deleteSiteMutation = useMutation({
    mutationFn: (siteId: string) => deleteSite(siteId),
    onSuccess: (result, siteId) => {
      if (result.success) {
        setSites((prev) => prev.filter((site) => site.id !== siteId));
        showToast("Sivusto poistettu", "success");
      } else {
        showToast(result.error || "Sivuston poisto epäonnistui.", "error");
      }
    },
    onError: () => {
      showToast("Odottamaton virhe tapahtui.", "error");
    },
  });

  useEffect(() => {
    // Kuuntele auth-muutoksia (kirjautuminen/uloskirjautuminen)
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        // Jos serveri on jo validoinut käyttäjän, ohita INITIAL_SESSION
        // koska se aiheuttaa tarpeettomia token refresh -yrityksiä
        if (event === "INITIAL_SESSION" && userId) {
          return;
        }

        setIsAuthenticated(!!session);
        if (session) {
          setIsLoginModalOpen(false);
          if (event === "SIGNED_IN") {
            router.refresh();
          }
        } else if (event === "SIGNED_OUT") {
          setIsLoginModalOpen(true);
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, userId]);

  const handleTogglePublish = (siteId: string, currentPublished: boolean) => {
    togglePublishMutation.mutate({
      siteId,
      published: !currentPublished,
    });
  };

  // Poisto on peruuttamaton, joten se vahvistetaan.
  const handleDeleteSite = async (site: Site) => {
    const name = site.custom_domain ?? `${site.subdomain}.rascalpages.fi`;
    const ok = await showConfirm(
      `Poistetaanko ${name}? Sivut, blogi, overlay-kampanjat ja tilastot poistetaan pysyvästi.`,
      () => {},
    );
    if (ok) deleteSiteMutation.mutate(site.id);
  };

  const groupCounts = Object.fromEntries(
    SITE_KINDS.map((kind) => [kind, sites.filter((site) => site.kind === kind).length]),
  ) as Record<SiteKind, number>;
  const groupSites = group === "all" ? sites : sites.filter((site) => site.kind === group);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleSites = normalizedQuery
    ? groupSites.filter((site) =>
        [site.subdomain, site.custom_domain, site.overlayOrigin]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery)),
      )
    : groupSites;

  // Kaikki-näkymässä ryhmät omien väliotsikoidensa alle.
  const sections =
    group === "all"
      ? SITE_KINDS.map((kind) => ({
          kind,
          sites: visibleSites.filter((site) => site.kind === kind),
        })).filter((section) => section.sites.length > 0)
      : [{ kind: group, sites: visibleSites }];

  const pageSites = groupSites.filter((site) => site.kind !== "overlay");
  const publishedCount = pageSites.filter((site) => site.published).length;
  const totals = sumKpis(groupSites.map((site) => site.kpis));
  const number = new Intl.NumberFormat("fi-FI");

  if (!isAuthenticated) {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">
              Kirjaudu sisään
            </h1>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="mt-4 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Kirjaudu sisään
            </button>
          </div>
        </div>
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      {planSiteId && (
        <PublishPlanDialog
          siteId={planSiteId}
          open
          onOpenChange={(open) => !open && setPlanSiteId(null)}
          onActivated={() => togglePublishMutation.mutate({ siteId: planSiteId, published: true })}
        />
      )}
      <div className="min-h-dvh bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold leading-tight tracking-tight">Sivustot</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Viimeiset {KPI_PERIOD_DAYS} päivää
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/app/dashboard/audiences"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-card px-3 text-sm font-medium transition-colors hover:bg-muted active:scale-[0.98] motion-reduce:active:scale-100"
              >
                <UsersRound className="size-4" aria-hidden />
                Kohderyhmät
              </Link>
              <NewSiteMenu
                onAiClick={() => setIsAiModalOpen(true)}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover active:scale-[0.98] motion-reduce:active:scale-100"
              />
              <AccountMenu />
            </div>
          </header>

          {sites.length > 0 && SITE_KINDS.filter((kind) => groupCounts[kind] > 0).length > 1 && (
            <SegmentedControl
              ariaLabel="Sivustoryhmä"
              value={group}
              onChange={setGroup}
              className="mb-4 w-full sm:inline-flex sm:w-auto"
              options={[
                { value: "all" as const, label: `Kaikki ${sites.length}` },
                ...SITE_KINDS.filter((kind) => groupCounts[kind] > 0).map((kind) => ({
                  value: kind,
                  label: `${GROUP_LABELS[kind]} ${groupCounts[kind]}`,
                })),
              ]}
            />
          )}

          {sites.length > 0 && (
            <section aria-label="Tunnusluvut" className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiTile
                icon={Eye}
                label="Näytöt"
                value={number.format(totals.views.current)}
                change={percentChange(totals.views)}
                hint="Ei vertailujaksoa"
              />
              <KpiTile
                icon={Inbox}
                label="Liidit ja konversiot"
                value={number.format(totals.leads.current)}
                change={percentChange(totals.leads)}
                hint="Ei vertailujaksoa"
              />
              <KpiTile
                icon={Target}
                label="Konversio"
                value={`${conversionPercent(totals.leads.current, totals.views.current).toFixed(1).replace(".", ",")} %`}
                hint="Liidit / näytöt"
              />
              <KpiTile
                icon={CircleCheck}
                label="Julkaistut sivut"
                value={`${publishedCount}/${pageSites.length}`}
                hint={
                  group === "all" || group === "overlay"
                    ? `${groupCounts.overlay} overlay-sivustoa`
                    : "Julkiset / kaikki"
                }
              />
            </section>
          )}

          {sites.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
                <Globe className="size-6" aria-hidden />
              </span>
              <h2 className="mt-4 text-lg font-semibold">Ensimmäinen sivusto</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Anna AI:n rakentaa sivu, aloita valmiista pohjasta tai personoi asiakkaan oma
                sivusto overlaylla.
              </p>
              <div className="mt-6">
                <NewSiteMenu
                  onAiClick={() => setIsAiModalOpen(true)}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-hover"
                />
              </div>
            </div>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-sm font-semibold">
                  {group === "all" ? "Kaikki sivustot" : GROUP_LABELS[group]}{" "}
                  <span className="font-normal text-muted-foreground">({groupSites.length})</span>
                </h2>
                {sites.length > 5 && (
                  <div className="relative sm:w-64">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Hae sivustoa"
                      aria-label="Hae sivustoa"
                      className="h-8 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                )}
              </div>
              <div
                className={cn(
                  "hidden border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground",
                  SITE_ROW_GRID,
                )}
                aria-hidden
              >
                <span>Sivusto</span>
                <span>Tila</span>
                <span className="text-right">Näytöt</span>
                <span className="text-right">Liidit</span>
                <span className="text-right">Konversio</span>
                <span />
              </div>
              {visibleSites.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Ei sivustoja haulla &quot;{query}&quot;.
                </p>
              ) : (
                sections.map((section) => (
                  <div key={section.kind}>
                    {group === "all" && sections.length > 1 && (
                      <h3 className="border-b border-border bg-muted/20 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {GROUP_LABELS[section.kind]} · {section.sites.length}
                      </h3>
                    )}
                    <ul className="divide-y divide-border border-b border-border last:border-b-0">
                      {section.sites.map((site) => (
                        <SiteRow
                          key={site.id}
                          site={site}
                          publishing={
                            togglePublishMutation.isPending &&
                            togglePublishMutation.variables?.siteId === site.id
                          }
                          onTogglePublish={() => handleTogglePublish(site.id, site.published)}
                          onDelete={() => handleDeleteSite(site)}
                        />
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </section>
          )}
        </div>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
      <CreateAiSiteModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        userId={userId}
      />
    </>
  );
}
