"use client";

import { useState, useEffect } from "react";
import { Globe, Search } from "lucide-react";
import { createClient } from "@/src/utils/supabase/client";
import LoginModal from "./LoginModal";
import CreateAiSiteModal from "./CreateAiSiteModal";
import NewSiteMenu from "./NewSiteMenu";
import SiteCard, { type DashboardSite } from "./SiteCard";
import { useRouter } from "next/navigation";
import { togglePagePublish } from "@/app/actions/toggle-publish";
import { deleteSite } from "@/app/actions";
import { useToast } from "@/app/components/ui/ToastContainer";
import ThemeToggle from "@/app/components/ThemeToggle";
import { createSiteId } from "@/src/lib/types";
import { AccountMenu } from "./AccountMenu";
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
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const router = useRouter();

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

  const normalizedQuery = query.trim().toLowerCase();
  const visibleSites = normalizedQuery
    ? sites.filter((site) =>
        [site.subdomain, site.custom_domain, site.overlayOrigin]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery)),
      )
    : sites;
  const publishedCount = sites.filter((site) => site.kind === "lander" && site.published).length;

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
      <div className="min-h-dvh bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold leading-tight tracking-tight">Sivustot</h1>
              {sites.length > 0 && (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {sites.length} {sites.length === 1 ? "sivusto" : "sivustoa"} · {publishedCount}{" "}
                  julkaistu
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NewSiteMenu
                onAiClick={() => setIsAiModalOpen(true)}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover active:scale-[0.98] motion-reduce:active:scale-100"
              />
              <AccountMenu />
            </div>
          </header>

          {sites.length > 6 && (
            <div className="relative mb-6 max-w-sm">
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
                className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
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
          ) : visibleSites.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Ei sivustoja haulla &quot;{query}&quot;.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleSites.map((site) => (
                <SiteCard
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
            </div>
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
