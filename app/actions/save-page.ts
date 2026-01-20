'use server';

import { createClient } from '@/src/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updatePageContent(
  siteId: string,
  content: any,
  published: boolean = false
): Promise<{ error?: string } | void> {
  const supabase = await createClient();

  // 1. Tarkista käyttäjä
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      error: 'Sinun täytyy olla kirjautunut sisään.',
    };
  }

  // 2. Hae käyttäjän organisaatio
  const { data: orgMember, error: orgMemberError } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!orgMember || orgMemberError) {
    return {
      error: 'Käyttäjätiliä ei löydy.',
    };
  }

  // 3. Varmista että käyttäjä omistaa sivuston
  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('id')
    .eq('id', siteId)
    .eq('user_id', orgMember.org_id)
    .single();

  if (siteError || !site) {
    return {
      error: 'Sivustoa ei löydy tai sinulla ei ole oikeuksia muokata sitä.',
    };
  }

  // 4. Hae tai luo 'home' sivu
  const { data: existingPage, error: pageCheckError } = await supabase
    .from('pages')
    .select('id')
    .eq('site_id', siteId)
    .eq('slug', 'home')
    .maybeSingle();

  if (pageCheckError) {
    console.error('Virhe sivun tarkistuksessa:', pageCheckError);
    return {
      error: 'Sivun tarkistus epäonnistui.',
    };
  }

  if (existingPage) {
    // Päivitä olemassa oleva sivu
    const { error: updateError } = await supabase
      .from('pages')
      .update({
        content: content,
        published: published,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingPage.id);

    if (updateError) {
      console.error('Virhe sivun päivityksessä:', updateError);
      return {
        error: 'Sivun päivitys epäonnistui.',
      };
    }
  } else {
    // Luo uusi sivu
    const { error: insertError } = await supabase
      .from('pages')
      .insert({
        site_id: siteId,
        slug: 'home',
        title: 'Etusivu',
        content: content,
        published: published,
      });

    if (insertError) {
      console.error('Virhe sivun luonnissa:', insertError);
      return {
        error: 'Sivun luominen epäonnistui.',
      };
    }
  }

  // 5. Revalidate path
  revalidatePath(`/app/dashboard/${siteId}`);
}
