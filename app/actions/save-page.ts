'use server';

import { createClient } from '@/src/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SiteId } from '@/src/lib/types';
import type { TemplateConfig } from '@/src/lib/templates';
import { getActiveOrgMember } from '@/src/lib/active-org';
import { pageHasUnpublishedChanges } from '@/src/lib/draft-publish';

type PageContent = TemplateConfig | Record<string, unknown>;

type OwnedPage =
  | {
      ok: true;
      supabase: SupabaseClient;
      page: { id: string; published: boolean | null; content: unknown } | null;
    }
  | { ok: false; error: string };

/** Käyttäjä → aktiivinen org → sivuston omistajuus → sivu (voi puuttua). */
async function loadOwnedPage(siteId: SiteId, pageSlug: string): Promise<OwnedPage> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: 'Sinun täytyy olla kirjautunut sisään.' };

  const orgMember = await getActiveOrgMember(supabase, user.id);
  if (!orgMember) return { ok: false, error: 'Käyttäjätiliä ei löydy.' };

  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('id')
    .eq('id', siteId)
    .eq('user_id', orgMember.org_id)
    .single();
  if (siteError || !site) {
    return { ok: false, error: 'Sivustoa ei löydy tai sinulla ei ole oikeuksia muokata sitä.' };
  }

  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('id, published, content')
    .eq('site_id', siteId)
    .eq('slug', pageSlug)
    .maybeSingle();
  if (pageError) {
    console.error('Virhe sivun tarkistuksessa:', pageError);
    return { ok: false, error: 'Sivun tarkistus epäonnistui.' };
  }

  return { ok: true, supabase, page };
}

async function insertPage(
  supabase: SupabaseClient,
  siteId: SiteId,
  pageSlug: string,
  content: PageContent,
  published: boolean,
): Promise<string | null> {
  const { error } = await supabase.from('pages').insert({
    site_id: siteId,
    slug: pageSlug,
    title: pageSlug === 'home' ? 'Etusivu' : pageSlug,
    content,
    published,
  });
  if (error) {
    console.error('Virhe sivun luonnissa:', error);
    return 'Sivun luominen epäonnistui.';
  }
  return null;
}

/**
 * Tallentaa editorin sisällön luonnokseksi. Julkaistun sivun kävijät näkevät
 * yhä live-sisällön, kunnes sivu julkaistaan (publishPage).
 */
export async function savePageDraft(
  siteId: SiteId,
  content: PageContent,
  pageSlug: string = 'home',
): Promise<{ error: string } | { hasUnpublishedChanges: boolean }> {
  const loaded = await loadOwnedPage(siteId, pageSlug);
  if (!loaded.ok) return { error: loaded.error };
  const { supabase, page } = loaded;

  if (!page) {
    // Ensimmäinen tallennus luo sivun julkaisemattomana.
    const error = await insertPage(supabase, siteId, pageSlug, content, false);
    if (error) return { error };
    revalidatePath(`/app/dashboard/${siteId}`);
    return { hasUnpublishedChanges: false };
  }

  // Luonnos omassa taulussaan: pages-rivit ovat julkisesti luettavia.
  const { error } = await supabase
    .from('page_drafts')
    .upsert(
      { page_id: page.id, content, updated_at: new Date().toISOString() },
      { onConflict: 'page_id' },
    );
  if (error) {
    console.error('Virhe luonnoksen tallennuksessa:', error);
    return { error: 'Sivun tallennus epäonnistui.' };
  }

  revalidatePath(`/app/dashboard/${siteId}`);
  return {
    hasUnpublishedChanges: pageHasUnpublishedChanges({
      published: page.published,
      content: page.content,
      draft_content: content,
    }),
  };
}

/** Julkaisee sivun: editorin nykyinen sisältö liveksi, luonnos tyhjäksi. */
export async function publishPage(
  siteId: SiteId,
  content: PageContent,
  pageSlug: string = 'home',
): Promise<{ error?: string } | void> {
  const loaded = await loadOwnedPage(siteId, pageSlug);
  if (!loaded.ok) return { error: loaded.error };
  const { supabase, page } = loaded;

  if (!page) {
    const error = await insertPage(supabase, siteId, pageSlug, content, true);
    if (error) return { error };
  } else {
    const { error } = await supabase
      .from('pages')
      .update({ content, published: true, updated_at: new Date().toISOString() })
      .eq('id', page.id);
    if (error) {
      console.error('Virhe sivun julkaisussa:', error);
      return { error: 'Julkaisu epäonnistui.' };
    }
    // Julkaistu sisältö = luonnos, joten luonnos poistetaan. Epäonnistuminen ei
    // kaada julkaisua: jäljelle jäänyt luonnos vastaa liveä.
    const { error: draftError } = await supabase.from('page_drafts').delete().eq('page_id', page.id);
    if (draftError) console.error('Virhe luonnoksen poistossa:', draftError);
  }

  revalidatePath(`/app/dashboard`);
  revalidatePath(`/app/dashboard/${siteId}`);
}

/** Piilottaa sivun kävijöiltä. Sisältö ja luonnos säilyvät. */
export async function unpublishPage(
  siteId: SiteId,
  pageSlug: string = 'home',
): Promise<{ error?: string } | void> {
  const loaded = await loadOwnedPage(siteId, pageSlug);
  if (!loaded.ok) return { error: loaded.error };
  const { supabase, page } = loaded;
  if (!page) return { error: 'Sivua ei ole vielä luotu.' };

  const { error } = await supabase
    .from('pages')
    .update({ published: false, updated_at: new Date().toISOString() })
    .eq('id', page.id);
  if (error) {
    console.error('Virhe sivun piilotuksessa:', error);
    return { error: 'Julkaisutilan päivitys epäonnistui.' };
  }

  revalidatePath(`/app/dashboard`);
  revalidatePath(`/app/dashboard/${siteId}`);
}
