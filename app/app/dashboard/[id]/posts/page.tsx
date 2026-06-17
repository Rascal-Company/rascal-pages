import { createClient } from "@/src/utils/supabase/server";
import { redirect } from "next/navigation";
import { getHomeUrl } from "@/app/lib/navigation";
import { mapPostRow, type PostRow } from "@/src/lib/posts";
import PostsClient from "./PostsClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PostsPage({ params }: PageProps) {
  const { id } = await params;
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

  const { data: site } = await supabase
    .from("sites")
    .select("id, subdomain")
    .eq("id", id)
    .eq("user_id", orgMember.org_id)
    .single();

  if (!site) {
    redirect("/app/dashboard");
  }

  const { data: postRows } = await supabase
    .from("posts")
    .select("*")
    .eq("site_id", id)
    .order("created_at", { ascending: false });

  const posts = ((postRows ?? []) as PostRow[]).map(mapPostRow);

  return (
    <PostsClient siteId={site.id} subdomain={site.subdomain} posts={posts} />
  );
}
