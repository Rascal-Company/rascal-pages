import { redirect } from "next/navigation";
import SiteAdminNav from "@/app/components/dashboard/SiteAdminNav";
import { loadSiteAdminNavForUser } from "../site-admin-nav-data";
import SitePagesView from "./view";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Suora osoite (päivitys, kirjanmerkki, dashboardin linkki). Pages-sivustolla
 * näkymä avautuu editorin päälle (ks. @modal); overlay-sivustolla omana sivunaan.
 */
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const nav = await loadSiteAdminNavForUser(id);
  if (nav.kind === "pages") redirect(`/app/dashboard/${id}?open=pages`);

  return (
    <div className="min-h-dvh bg-brand-light">
      <SiteAdminNav {...nav} />
      <SitePagesView siteId={id} />
    </div>
  );
}
