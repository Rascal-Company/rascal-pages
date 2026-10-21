import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/app/dashboard/${id}/overlay`}
          className="-ml-1 mb-6 inline-flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Kampanjat
        </Link>
        <h1 className="text-3xl font-bold leading-tight tracking-tight">Kohderyhmät</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Profiilit ovat yhteisiä kaikille kampanjoille. AI kirjoittaa laskeutumissivun
          variaatiot sille valitun kohderyhmän pohjalta.
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
