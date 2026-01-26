'use server';

import { createClient } from '@/src/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import type { SiteId } from '@/src/lib/types';

export async function togglePagePublish(
  siteId: SiteId,
  published: boolean
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

  // 4. Hae sivuston 'home' sivu
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('id')
    .eq('site_id', siteId)
    .eq('slug', 'home')
    .maybeSingle();

  if (pageError) {
    console.error('Virhe sivun haussa:', pageError);
    return {
      error: 'Sivun haku epäonnistui.',
    };
  }

  // 5. Päivitä tai luo sivu julkaisutilalla
  if (page) {
    // Päivitä olemassa oleva sivu
    const { error: updateError } = await supabase
      .from('pages')
      .update({
        published: published,
        updated_at: new Date().toISOString(),
      })
      .eq('id', page.id);

    if (updateError) {
      console.error('Virhe julkaisutilan päivityksessä:', updateError);
      return {
        error: 'Julkaisutilan päivitys epäonnistui.',
      };
    }
  } else {
    // Jos sivua ei ole ollenkaan, ei voida julkaista
    return {
      error: 'Sivua ei ole vielä luotu. Muokkaa sivua ensin.',
    };
  }

  // 6. Revalidate path
  revalidatePath(`/app/dashboard`);
  revalidatePath(`/app/dashboard/${siteId}`);
}
