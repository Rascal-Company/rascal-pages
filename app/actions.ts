'use server';

import { createClient } from '@/src/utils/supabase/server';
import { redirect } from 'next/navigation';

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
  redirect('/dashboard');
}
