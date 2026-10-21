import Link from "next/link";
import { createAdminClient } from "@/src/utils/supabase/admin";
import { loadOverlayContext, loadProfiles } from "../overlay-data";
import ProfilesClient from "./ProfilesClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OverlayProfilesPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase, orgId } = await loadOverlayContext(id);

  // CRM-segmentit (Rascal CRM) tuotaviksi profiileiksi. Service-rolella, koska
  // organisaatio on jo tarkistettu.
  const { data: segments } = await createAdminClient()
    .from("contact_segments")
    .select("id, name, total_contacts")
    .eq("user_id", orgId)
    .order("name");

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/app/dashboard/${id}/overlay`}
          className="mb-4 inline-flex items-center text-sm text-brand-dark/70 hover:text-brand-dark"
        >
          ← Kampanjat
        </Link>
        <h1 className="text-3xl font-bold text-brand-dark">Kohderyhmäprofiilit</h1>
        <p className="mt-2 text-sm text-brand-dark/70">
          Profiilit ovat yhteisiä kaikille kampanjoille. AI kirjoittaa laskeutumissivun
          variaatiot sille valitun profiilin pohjalta.
        </p>
        <div className="mt-8">
          <ProfilesClient
            initialProfiles={await loadProfiles(supabase, orgId)}
            crmSegments={(segments ?? []).map((s) => ({
              id: s.id as string,
              name: (s.name as string) ?? "",
              totalContacts: (s.total_contacts as number) ?? 0,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
