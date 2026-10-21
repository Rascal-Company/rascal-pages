import { createClient } from "@/src/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { createSiteId } from "@/src/lib/types";
import { getHomeUrl } from "@/app/lib/navigation";
import {
  createOverlayVariantId,
  type OverlayChange,
  type OverlayMatch,
} from "@/src/lib/overlay";
import OverlayEditor from "./OverlayEditor";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string; variantId: string }>;
}

export default async function OverlayVariantPage({ params }: PageProps) {
  const { id, variantId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(getHomeUrl());
  }

  const { data: orgMember } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!orgMember) {
    return <div>Virhe: Organisaatiota ei löydy.</div>;
  }

  const { data: variant } = await supabase
    .from("overlay_variants")
    .select(
      "id, site_id, name, target_origin, path_pattern, match, changes, active, sites!inner(user_id)",
    )
    .eq("id", variantId)
    .eq("site_id", id)
    .maybeSingle();

  const site = variant?.sites as unknown as { user_id: string } | undefined;
  if (!variant || site?.user_id !== orgMember.org_id) {
    notFound();
  }

  return (
    <OverlayEditor
      siteId={createSiteId(id)}
      variantId={createOverlayVariantId(variant.id)}
      targetOrigin={variant.target_origin}
      initial={{
        name: variant.name,
        pathPattern: variant.path_pattern,
        match: variant.match as OverlayMatch,
        changes: variant.changes as OverlayChange[],
        active: variant.active,
      }}
    />
  );
}
