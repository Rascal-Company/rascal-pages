import { createClient } from '@/src/utils/supabase/server';
import { notFound } from 'next/navigation';
import SiteRenderer from '@/app/components/renderer/SiteRenderer';

// Estetään pre-rendering build-aikana, koska sivu vaatii runtime-tietokantakutsuja
export const dynamic = 'force-dynamic';

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

  if (siteError) {
    console.error('Virhe sivuston haussa:', siteError);
    notFound();
  }

  if (!site) {
    console.log(`Sivustoa ei löydy subdomainilla: ${domain}`);
    notFound();
  }

  // Hae julkaistu sivu (slug='home' oletuksena)
  // Huom: Jos sivua ei ole julkaistu, käytetään oletussisältöä
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('*')
    .eq('site_id', site.id)
    .eq('slug', 'home')
    .maybeSingle();

  if (pageError) {
    console.error('Virhe sivun haussa:', pageError);
  }

  // Jos sivua ei löydy tai se ei ole julkaistu, käytetään oletustemplatea
  const { getDefaultTemplate } = await import('@/src/lib/templates');
  const defaultTemplate = getDefaultTemplate();
  const defaultContent = defaultTemplate.defaultContent;

  const content = page?.content || defaultContent;

  return <SiteRenderer content={content} />;
}
