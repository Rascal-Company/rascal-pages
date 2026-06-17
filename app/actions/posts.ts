"use server";

import { createClient } from "@/src/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deriveExcerpt, slugify } from "@/src/lib/posts";

export type PostInput = {
  title: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  coverImage?: string;
  published?: boolean;
  seoTitle?: string;
  seoDescription?: string;
};

type PostResult =
  | { success: true; postId: string }
  | { success: false; error: string };

type MutateResult = { success: true } | { success: false; error: string };

async function resolveOrgId(
  supabase: SupabaseClient,
): Promise<{ orgId: string } | { error: string }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Sinun täytyy olla kirjautunut sisään." };
  }

  const { data: orgMember } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!orgMember) return { error: "Käyttäjätiliä ei löydy." };
  return { orgId: orgMember.org_id };
}

async function assertSiteOwnership(
  client: SupabaseClient,
  siteId: string,
  orgId: string,
): Promise<boolean> {
  const { data } = await client
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("user_id", orgId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Build the persisted row shape from user input, filling slug/excerpt/publish
 * defaults. Pure and reused by both create and update.
 *
 * `existingPublishedAt` preserves the original publish date on updates: a post
 * that is (still) published keeps its first-publish timestamp instead of being
 * reset on every save. A new publish (no existing timestamp) gets "now".
 */
function toPostRow(
  input: PostInput,
  existingPublishedAt: string | null = null,
): {
  slug: string;
  fields: Record<string, unknown>;
} | null {
  const title = input.title.trim();
  if (!title) return null;

  const slug = slugify(input.slug || title);
  if (!slug) return null;

  const content = input.content ?? "";
  const published = input.published ?? false;

  return {
    slug,
    fields: {
      title,
      slug,
      content,
      excerpt:
        input.excerpt?.trim() || (content ? deriveExcerpt(content) : null),
      cover_image: input.coverImage?.trim() || null,
      published,
      published_at: published
        ? (existingPublishedAt ?? new Date().toISOString())
        : null,
      seo_title: input.seoTitle?.trim() || null,
      seo_description: input.seoDescription?.trim() || null,
    },
  };
}

export async function createPostCore(
  client: SupabaseClient,
  orgId: string,
  siteId: string,
  input: PostInput,
): Promise<PostResult> {
  if (!(await assertSiteOwnership(client, siteId, orgId))) {
    return { success: false, error: "Sivustoa ei löydy tai ei oikeuksia." };
  }

  const row = toPostRow(input);
  if (!row) return { success: false, error: "Otsikko on pakollinen." };

  const { data, error } = await client
    .from("posts")
    .insert({ site_id: siteId, ...row.fields })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return { success: false, error: "Tämä slug on jo käytössä." };
    }
    console.error("Virhe postauksen luonnissa:", error);
    return { success: false, error: "Postauksen luonti epäonnistui." };
  }
  return { success: true, postId: data.id };
}

export async function updatePostCore(
  client: SupabaseClient,
  orgId: string,
  siteId: string,
  postId: string,
  input: PostInput,
): Promise<PostResult> {
  if (!(await assertSiteOwnership(client, siteId, orgId))) {
    return { success: false, error: "Sivustoa ei löydy tai ei oikeuksia." };
  }

  // Preserve the original publish date instead of resetting it on every save.
  const { data: existing } = await client
    .from("posts")
    .select("published_at")
    .eq("id", postId)
    .eq("site_id", siteId)
    .maybeSingle();

  const row = toPostRow(input, existing?.published_at ?? null);
  if (!row) return { success: false, error: "Otsikko on pakollinen." };

  const { data, error } = await client
    .from("posts")
    .update(row.fields)
    .eq("id", postId)
    .eq("site_id", siteId)
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return { success: false, error: "Tämä slug on jo käytössä." };
    }
    console.error("Virhe postauksen päivityksessä:", error);
    return { success: false, error: "Postauksen päivitys epäonnistui." };
  }
  return { success: true, postId: data.id };
}

export async function deletePostCore(
  client: SupabaseClient,
  orgId: string,
  siteId: string,
  postId: string,
): Promise<MutateResult> {
  if (!(await assertSiteOwnership(client, siteId, orgId))) {
    return { success: false, error: "Sivustoa ei löydy tai ei oikeuksia." };
  }

  const { error } = await client
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("site_id", siteId);

  if (error) {
    console.error("Virhe postauksen poistossa:", error);
    return { success: false, error: "Postauksen poisto epäonnistui." };
  }
  return { success: true };
}

export async function createPost(
  siteId: string,
  input: PostInput,
): Promise<PostResult> {
  const supabase = await createClient();
  const org = await resolveOrgId(supabase);
  if ("error" in org) return { success: false, error: org.error };

  const result = await createPostCore(supabase, org.orgId, siteId, input);
  if (result.success) revalidatePath(`/app/dashboard/${siteId}/posts`);
  return result;
}

export async function updatePost(
  siteId: string,
  postId: string,
  input: PostInput,
): Promise<PostResult> {
  const supabase = await createClient();
  const org = await resolveOrgId(supabase);
  if ("error" in org) return { success: false, error: org.error };

  const result = await updatePostCore(
    supabase,
    org.orgId,
    siteId,
    postId,
    input,
  );
  if (result.success) revalidatePath(`/app/dashboard/${siteId}/posts`);
  return result;
}

export async function deletePost(
  siteId: string,
  postId: string,
): Promise<MutateResult> {
  const supabase = await createClient();
  const org = await resolveOrgId(supabase);
  if ("error" in org) return { success: false, error: org.error };

  const result = await deletePostCore(supabase, org.orgId, siteId, postId);
  if (result.success) revalidatePath(`/app/dashboard/${siteId}/posts`);
  return result;
}
