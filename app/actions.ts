'use server';

import { createClient } from '@/src/utils/supabase/server';
import { redirect } from 'next/navigation';

// Poista sivusto
interface DeleteSiteResult {
  success?: boolean;
  error?: string;
}

export async function deleteSite(siteId: string): Promise<DeleteSiteResult> {
  try {
    // Hae autentikoitu käyttäjä
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Varmista että käyttäjä on kirjautunut sisään
    if (authError || !user) {
      return {
        error: 'Sinun täytyy olla kirjautunut sisään poistaaksesi sivuston.',
      };
    }

    const authUserId = user.id;

    // Hae käyttäjän organisaatio org_members taulusta
    const { data: orgMember, error: orgMemberError } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    // Jos käyttäjää ei löydy org_members taulusta, palautetaan virhe
    if (!orgMember) {
      return {
        error: 'Käyttäjätiliä ei löydy. Ota yhteyttä tukeen.',
      };
    }

    // Jos tarkistuksessa tuli virhe, palautetaan virhe
    if (orgMemberError) {
      console.error('Virhe organisaation tarkistuksessa:', orgMemberError);
      return {
        error: 'Käyttäjätilin tarkistus epäonnistui. Yritä uudelleen.',
      };
    }

    // Käytetään org_id:ta (public.users.id) sivuston poistamiseen
    const userId = orgMember.org_id;

    // Tarkista että sivusto kuuluu käyttäjälle
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, user_id')
      .eq('id', siteId)
      .maybeSingle();

    if (siteError) {
      console.error('Virhe sivuston tarkistuksessa:', siteError);
      return {
        error: 'Sivuston tarkistus epäonnistui. Yritä uudelleen.',
      };
    }

    if (!site) {
      return {
        error: 'Sivustoa ei löydy.',
      };
    }

    // Varmista että sivusto kuuluu käyttäjälle
    if (site.user_id !== userId) {
      return {
        error: 'Sinulla ei ole oikeuksia poistaa tätä sivustoa.',
      };
    }

    // Poista sivustoon liittyvät sivut
    const { error: pagesError } = await supabase
      .from('pages')
      .delete()
      .eq('site_id', siteId);

    if (pagesError) {
      console.error('Virhe sivujen poistossa:', pagesError);
      return {
        error: 'Sivujen poisto epäonnistui. Yritä uudelleen.',
      };
    }

    // Poista sivusto
    const { error: deleteError } = await supabase
      .from('sites')
      .delete()
      .eq('id', siteId);

    if (deleteError) {
      console.error('Virhe sivuston poistossa:', deleteError);
      return {
        error: 'Sivuston poisto epäonnistui. Yritä uudelleen.',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Odottamaton virhe sivuston poistossa:', error);
    return {
      error: 'Odottamaton virhe tapahtui. Yritä uudelleen.',
    };
  }
}

export async function createSite(formData: FormData) {
  const subdomain = formData.get('subdomain') as string;

  // Validoi että subdomain on annettu
  if (!subdomain || typeof subdomain !== 'string') {
    return {
      error: 'Subdomain on pakollinen',
    };
  }

  // Validoi että subdomain on vain kirjaimia ja numeroita
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  if (!alphanumericRegex.test(subdomain)) {
    return {
      error: 'Subdomain voi sisältää vain kirjaimia ja numeroita',
    };
  }

  // Hae autentikoitu käyttäjä
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Varmista että käyttäjä on kirjautunut sisään
  if (authError || !user) {
    return {
      error: 'Sinun täytyy olla kirjautunut sisään luodaksesi sivuston.',
    };
  }

  const authUserId = user.id;

  // Hae käyttäjän organisaatio org_members taulusta
  const { data: orgMember, error: orgMemberError } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  // Jos käyttäjää ei löydy org_members taulusta, palautetaan virhe
  if (!orgMember) {
    return {
      error: 'Käyttäjätiliä ei löydy. Ota yhteyttä tukeen.',
    };
  }

  // Jos tarkistuksessa tuli virhe, palautetaan virhe
  if (orgMemberError) {
    console.error('Virhe organisaation tarkistuksessa:', orgMemberError);
    return {
      error: 'Käyttäjätilin tarkistus epäonnistui. Yritä uudelleen.',
    };
  }

  // Käytetään org_id:ta (public.users.id) sivuston luomiseen
  const userId = orgMember.org_id;

  // Tarkista onko subdomain jo käytössä Supabase REST API:n kautta
  const { data: existingSites, error: checkError } = await supabase
    .from('sites')
    .select('id')
    .eq('subdomain', subdomain)
    .limit(1);

  if (checkError) {
    console.error('Virhe subdomainin tarkistuksessa:', checkError);
    return {
      error: 'Tarkistus epäonnistui. Yritä uudelleen.',
    };
  }

  if (existingSites && existingSites.length > 0) {
    return {
      error: 'Tämä subdomain on jo käytössä',
    };
  }

  // Luo uusi sivusto Supabase REST API:n kautta
  const { error: insertError } = await supabase
    .from('sites')
    .insert({
      user_id: userId,
      subdomain: subdomain,
      custom_domain: null,
      settings: {},
    });

  if (insertError) {
    console.error('Virhe sivuston luonnissa:', insertError);
    return {
      error: 'Sivuston luominen epäonnistui. Yritä uudelleen.',
    };
  }

  // Redirect dashboardiin onnistuessa
  // Huom: redirect() heittää poikkeuksen, joka Next.js käsittelee automaattisesti
  redirect('/app/dashboard');
}
