"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/client";

type OrgProduct = {
  slug: string;
  status: string;
  access_type: string | null;
  trial_ends_at: string | null;
};

type ProductAccessState = {
  hasAccess: boolean;
  products: OrgProduct[];
  currentProduct: OrgProduct | null;
  isLoading: boolean;
  orgId: string | null;
};

export function useProductAccess(productSlug: string): ProductAccessState {
  const [state, setState] = useState<ProductAccessState>({
    hasAccess: false,
    products: [],
    currentProduct: null,
    isLoading: true,
    orgId: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (!cancelled) {
            setState({
              hasAccess: false,
              products: [],
              currentProduct: null,
              isLoading: false,
              orgId: null,
            });
          }
          return;
        }

        const { data: member } = await supabase
          .from("org_members")
          .select("org_id")
          .eq("auth_user_id", user.id)
          .limit(1)
          .single();

        if (!member) {
          if (!cancelled) {
            setState({
              hasAccess: false,
              products: [],
              currentProduct: null,
              isLoading: false,
              orgId: null,
            });
          }
          return;
        }

        const { data: products } = await supabase.rpc("get_org_products", {
          p_org_id: member.org_id,
        });

        const orgProducts = (products ?? []) as OrgProduct[];
        const current =
          orgProducts.find((p) => p.slug === productSlug) ?? null;
        const hasAccess =
          current !== null &&
          current.status === "active" &&
          (current.access_type === "pro" ||
            (current.access_type === "trial" &&
              new Date(current.trial_ends_at!) > new Date()));

        if (!cancelled) {
          setState({
            hasAccess,
            products: orgProducts,
            currentProduct: current,
            isLoading: false,
            orgId: member.org_id,
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            hasAccess: false,
            products: [],
            currentProduct: null,
            isLoading: false,
            orgId: null,
          });
        }
      }
    }

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [productSlug]);

  return state;
}
