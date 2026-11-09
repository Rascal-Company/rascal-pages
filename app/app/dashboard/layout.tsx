import type { ReactNode } from "react";
import { createClient } from "@/src/utils/supabase/server";
import { NoAccessPage } from "@/src/components/NoAccessPage";
import { PAGES_PRODUCT_SLUG, productAccess, type OrgProductRow } from "@/src/lib/product-access";
import { getActiveOrgMember } from "@/src/lib/active-org";
import { getBrandContext, type BrandOption } from "@/app/actions/brand";

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

  const orgMember = await getActiveOrgMember(supabase, user.id);
  if (!orgMember) return children;

  const { data, error } = await supabase.rpc("get_org_products", { p_org_id: orgMember.org_id });
  if (error) {
    // Tarkistuksen virhe ei saa lukita maksavia asiakkaita ulos: kirjataan ja päästetään.
    console.error("[dashboard] get_org_products failed:", error);
    return children;
  }

  const access = productAccess(data as OrgProductRow[], PAGES_PRODUCT_SLUG);
  if (!access.hasAccess) {
    const switchableBrands = await brandsWithPages(supabase, orgMember.org_id);
    return <NoAccessPage trialExpired={access.trialExpired} switchableBrands={switchableBrands} />;
  }
  return children;
}

/** Monibrändi: käyttäjän muut brändit, joissa Pages on käytössä. */
async function brandsWithPages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  activeOrgId: string,
): Promise<BrandOption[]> {
  const context = await getBrandContext().catch(() => null);
  const others = context?.brands.filter((b) => b.id !== activeOrgId) ?? [];
  const checks = await Promise.all(
    others.map(async (brand) => {
      const { data, error } = await supabase.rpc("get_org_products", { p_org_id: brand.id });
      return !error && productAccess(data as OrgProductRow[], PAGES_PRODUCT_SLUG).hasAccess ? brand : null;
    }),
  );
  return checks.filter((b): b is BrandOption => b !== null);
}
