import { cache, type ReactNode } from "react";
import type { Metadata } from "next";
import { createClient } from "@/src/utils/supabase/server";
import { getSiteByDomain } from "@/src/lib/site-queries";
import { getSiteEntitlements } from "@/src/lib/site-plan-server";
import { getAppUrl } from "@/app/lib/navigation";

/**
 * Julkaisun maksumuuri julkiselle sivustolle (RAS-1169). Ilman voimassa olevaa
 * pakettia kävijä näkee "Tulossa pian" -sivun (noindex). Omistaja-orgin
 * kirjautunut jäsen näkee sivuston esikatseluna julkaisukehotteen kera.
 * Sisältöä ei poisteta: tilauksen palautuessa sivusto näkyy sellaisenaan.
 */

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ domain: string }>;
}

type Access =
  | { visibility: "live"; showBadge: boolean }
  | { visibility: "owner-preview"; siteId: string }
  | { visibility: "hidden" };

async function isOrgMember(orgId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .eq("org_id", orgId)
    .maybeSingle();
  return Boolean(data);
}

// Sama pyyntö kutsuu tätä sekä metadatasta että layoutista.
const resolveAccess = cache(async (domain: string): Promise<Access> => {
  const site = await getSiteByDomain(domain);
  // Tuntematon domain: sivun oma notFound() hoitaa.
  if (!site) return { visibility: "live", showBadge: false };

  try {
    const entitlements = await getSiteEntitlements(site.id, site.user_id);
    if (entitlements.canPublish) return { visibility: "live", showBadge: entitlements.showBadge };
  } catch (error) {
    // Kanta ei vastaa: näytetään sivusto mieluummin kuin piilotetaan kaikki.
    console.error("Sivuston pakettitilan tarkistus epäonnistui, näytetään sivusto:", error);
    return { visibility: "live", showBadge: false };
  }

  const owner = await isOrgMember(site.user_id).catch(() => false);
  return owner ? { visibility: "owner-preview", siteId: site.id } : { visibility: "hidden" };
});

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { domain } = await params;
  const access = await resolveAccess(domain);
  return access.visibility === "live" ? {} : { robots: { index: false, follow: false } };
}

function ComingSoon() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#fdf9f6] px-4 text-center text-[#1a1a1a]">
      <div className="max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight">Tulossa pian</h1>
        <p className="mt-3 text-[#5c564f]">Sivusto avautuu pian. Tervetuloa takaisin!</p>
      </div>
    </main>
  );
}

function OwnerPreviewBanner({ siteId }: { siteId: string }) {
  return (
    <div className="sticky top-0 z-[100] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-[#1a1a1a] px-4 py-2 text-center text-sm text-white">
      <span>Esikatselu: sivusto ei ole julkinen. Vain sinä näet sen.</span>
      <a href={getAppUrl(`/dashboard/${siteId}`)} className="font-semibold underline underline-offset-2">
        Julkaise sivusto →
      </a>
    </div>
  );
}

function MadeWithRascalBadge() {
  return (
    <a
      href="https://rascalpages.fi"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-3 right-3 z-[100] rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-[#1a1a1a] shadow-[0_0_0_1px_rgba(26,26,26,0.08),0_4px_12px_rgba(0,0,0,0.08)] backdrop-blur"
    >
      Tehty Rascal Pagesilla
    </a>
  );
}

export default async function SiteLayout({ children, params }: LayoutProps) {
  const { domain } = await params;
  const access = await resolveAccess(domain);

  if (access.visibility === "hidden") return <ComingSoon />;

  if (access.visibility === "owner-preview") {
    return (
      <>
        <OwnerPreviewBanner siteId={access.siteId} />
        {children}
      </>
    );
  }

  return (
    <>
      {children}
      {access.showBadge && <MadeWithRascalBadge />}
    </>
  );
}
