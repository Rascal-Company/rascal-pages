import type { ReactNode } from "react";
import { createClient } from "@/src/utils/supabase/server";
import { NoAccessPage } from "@/src/components/NoAccessPage";
import { PAGES_PRODUCT_SLUG, productAccess, type OrgProductRow } from "@/src/lib/product-access";

/**
 * Dashboard vain organisaatioille, joilla on Rascal Pages -tuote. Muuten
 * näytetään "Ei käyttöoikeutta" (tai päättynyt kokeilu). Kirjautumattomat ja
 * organisaatiottomat ohjataan kuten ennenkin sivujen omissa tarkistuksissa.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return children;

  const { data: orgMember } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!orgMember) return children;

  const { data, error } = await supabase.rpc("get_org_products", { p_org_id: orgMember.org_id });
  if (error) {
    // Tarkistuksen virhe ei saa lukita maksavia asiakkaita ulos: kirjataan ja päästetään.
    console.error("[dashboard] get_org_products failed:", error);
    return children;
  }

  const access = productAccess(data as OrgProductRow[], PAGES_PRODUCT_SLUG);
  if (!access.hasAccess) return <NoAccessPage trialExpired={access.trialExpired} />;
  return children;
}
