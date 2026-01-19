import { createClient } from '@/src/utils/supabase/server';
import { notFound } from 'next/navigation';
import SiteRenderer from '@/app/components/renderer/SiteRenderer';

interface PageProps {
  params: Promise<{ domain: string }>;
}

export default async function PublicSitePage({ params }: PageProps) {
  const { domain } = await params;
  const supabase = await createClient();

  // Hae sivuston tiedot subdomainin perusteella
  const { data: site, error: siteError } = await supabase
    .from('sites')
    .select('*')
    .eq('subdomain', domain)
    .maybeSingle();

  if (siteError || !site) {
    notFound();
  }

  // Hae julkaistu sivu (slug='home' oletuksena)
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('*')
    .eq('site_id', site.id)
    .eq('slug', 'home')
    .eq('published', true)
    .maybeSingle();

  // Jos sivua ei löydy tai se ei ole julkaistu, käytetään oletussisältöä
  const defaultContent = {
    hero: {
      title: 'Tervetuloa',
      subtitle: 'Sivusto on rakenteilla',
      cta: 'Ota yhteyttä',
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
      primaryColor: '#3B82F6',
    },
  };

  const content = page?.content || defaultContent;

  return <SiteRenderer content={content} />;
}
