import { createClient } from '@/src/utils/supabase/server';
import { redirect } from 'next/navigation';
import Editor from '@/app/components/editor/Editor';

// Estetään pre-rendering build-aikana, koska sivu vaatii käyttäjäsession
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SiteEditorPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Tarkista käyttäjä
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/');
  }

  // 2. Hae käyttäjän organisaatio
  const { data: orgMember, error: orgMemberError } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!orgMember || orgMemberError) {
    return <div>Virhe: Organisaatiota ei löydy.</div>;
  }

  // 3. Hae sivuston tiedot
  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('*')
    .eq('id', id)
    .eq('user_id', orgMember.org_id)
    .single();

  if (siteError || !site) {
    redirect('/dashboard');
  }

  // 4. Hae sivuston 'home' sivu tai luo oletusrakenne
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('*')
    .eq('site_id', id)
    .eq('slug', 'home')
    .maybeSingle();

  // Oletussisältö jos sivua ei ole
  const defaultContent = {
    hero: {
      title: 'Tervetuloa',
      subtitle: 'Tämä on oletusotsikko',
      cta: 'Aloita',
      ctaLink: '#',
    },
    features: [
      {
        icon: '⭐',
        title: 'Ominaisuus 1',
        description: 'Kuvaus ominaisuudesta',
      },
    ],
    theme: {
      primaryColor: '#000000',
    },
  };

  const pageContent = page?.content || defaultContent;
  const pageId = page?.id || null;

  return (
    <Editor
      siteId={id}
      pageId={pageId}
      siteSubdomain={site.subdomain}
      initialContent={pageContent}
    />
  );
}
