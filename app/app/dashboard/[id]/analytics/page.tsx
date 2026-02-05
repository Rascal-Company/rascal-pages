import { createClient } from "@/src/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import LeadsTable from "./LeadsTable";
import { getHomeUrl } from "@/app/lib/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AnalyticsPage({ params }: PageProps) {
  const { id: siteId } = await params;
  const supabase = await createClient();

  // 1. Check user authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(getHomeUrl());
  }

  // 2. Get user's organization
  const { data: orgMember } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!orgMember) {
    return <div>Virhe: Organisaatiota ei löydy.</div>;
  }

  // 3. Verify site ownership
  const { data: site } = await supabase
    .from("sites")
    .select("subdomain, custom_domain, user_id")
    .eq("id", siteId)
    .maybeSingle();

  if (!site || site.user_id !== orgMember.org_id) {
    notFound();
  }

  // 4. Fetch leads
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(100);

  // 5. Fetch analytics events
  const { data: events } = await supabase
    .from("analytics_events")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(100);

  // 6. Calculate statistics
  const totalLeads = leads?.length || 0;
  const totalPageViews =
    events?.filter((e) => e.event_type === "page_view").length || 0;
  const totalClicks =
    events?.filter((e) => e.event_type === "cta_click").length || 0;

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <Link
              href="/app/dashboard"
              className="text-sm text-brand-dark/60 hover:text-brand-dark"
            >
              ← Takaisin sivustoihin
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-brand-dark">Analytiikka</h1>
          <p className="mt-2 text-sm text-brand-dark/70">
            {site.subdomain}.rascalpages.fi
            {site.custom_domain && ` · ${site.custom_domain}`}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-brand-dark/10 bg-brand-beige p-6">
            <p className="text-sm font-medium text-brand-dark/70">
              Yhteensä liidejä
            </p>
            <p className="mt-2 text-3xl font-bold text-brand-dark">
              {totalLeads}
            </p>
          </div>
          <div className="rounded-lg border border-brand-dark/10 bg-brand-beige p-6">
            <p className="text-sm font-medium text-brand-dark/70">
              Sivun katselut
            </p>
            <p className="mt-2 text-3xl font-bold text-brand-dark">
              {totalPageViews}
            </p>
          </div>
          <div className="rounded-lg border border-brand-dark/10 bg-brand-beige p-6">
            <p className="text-sm font-medium text-brand-dark/70">
              CTA-klikkaukset
            </p>
            <p className="mt-2 text-3xl font-bold text-brand-dark">
              {totalClicks}
            </p>
          </div>
        </div>

        {/* Leads Table */}
        <LeadsTable leads={leads || []} />

        {/* Analytics Events Table */}
        <div className="rounded-lg border border-brand-dark/10 bg-brand-beige">
          <div className="border-b border-brand-dark/10 px-6 py-4">
            <h2 className="text-xl font-semibold text-brand-dark">
              Tapahtumat (viimeisimmät 100)
            </h2>
          </div>
          <div className="overflow-x-auto">
            {!events || events.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-brand-dark/60">
                  Ei vielä tapahtumia. Kun joku vierailee sivulla tai klikkaa
                  nappia, se näkyy tässä.
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-brand-dark/70">
                      Tapahtuma
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-brand-dark/70">
                      Tiedot
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-brand-dark/70">
                      Aika
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-dark/10 bg-brand-beige">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-white/50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            event.event_type === "page_view"
                              ? "bg-blue-100 text-blue-800"
                              : event.event_type === "cta_click"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {event.event_type === "page_view"
                            ? "Sivun katselu"
                            : event.event_type === "cta_click"
                              ? "CTA-klikkaus"
                              : event.event_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-brand-dark/70">
                        {event.event_type === "cta_click" && (
                          <span>
                            {(event.metadata as Record<string, unknown>)?.text
                              ? `"${String((event.metadata as Record<string, unknown>).text)}"`
                              : String(
                                  (event.metadata as Record<string, unknown>)
                                    ?.href,
                                ) || "-"}
                          </span>
                        )}
                        {event.event_type === "page_view" && (
                          <span className="text-xs">
                            {(event.metadata as Record<string, unknown>)
                              ?.referrer
                              ? `Lähde: ${String((event.metadata as Record<string, unknown>).referrer)}`
                              : "Suora vierailu"}
                          </span>
                        )}
                        {event.event_type !== "cta_click" &&
                          event.event_type !== "page_view" && <span>-</span>}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-brand-dark/70">
                        {new Date(event.created_at).toLocaleString("fi-FI", {
                          timeZone: "Europe/Helsinki",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
