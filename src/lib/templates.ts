/**
 * Template-konfiguraatio - Single Source of Truth
 * Määrittelee saatavilla olevat landing page -templatet ja niiden kentät
 */

export interface TemplateConfig {
  templateId: string;
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    image?: string;
  };
  videoUrl?: string; // VSL-templatelle
  features?: Array<{
    title: string;
    description: string;
    icon: string;
    image?: string;
  }>;
  about?: {
    name: string;
    bio: string;
    image?: string;
  }; // Personal-templatelle
  testimonials?: Array<{
    name: string;
    text: string;
    company?: string;
    avatar?: string;
  }>;
  faq?: Array<{
    question: string;
    answer: string;
  }>;
  theme?: {
    primaryColor: string;
  };
}

export interface Template {
  id: string;
  name: string;
  description: string;
  defaultContent: TemplateConfig;
}

export const TEMPLATES: Template[] = [
  {
    id: 'lead-magnet',
    name: 'E-kirja / Lead Magnet',
    description: 'Optimaalinen konversion kannalta. Vasemmalla teksti/pisteet, oikealla lomake/kuva.',
    defaultContent: {
      templateId: 'lead-magnet',
      hero: {
        title: 'Lataa ilmainen E-kirja',
        subtitle: 'Opit tärkeimmät vinkit ja strategiat jo tänään. Aloita heti!',
        ctaText: 'Lataa nyt ilmaiseksi',
        ctaLink: '#download',
      },
      features: [
        {
          icon: '📚',
          title: 'Yli 50 sivua käytännön vinkkejä',
          description: 'Saat välittömästi toimivia strategioita, joita voit soveltaa heti.',
        },
        {
          icon: '⚡',
          title: 'Aloita heti',
          description: 'Ei vaadi erityistä osaamista. Kaikki selitetty yksinkertaisesti.',
        },
        {
          icon: '🎯',
          title: 'Todistettu menetelmä',
          description: 'Tuhannet ovat jo hyötyneet tästä oppaasta. Olet seuraava.',
        },
      ],
      theme: {
        primaryColor: '#3B82F6',
      },
    },
  },
  {
    id: 'waitlist',
    name: 'Odotuslista',
    description: 'Keskitetty, minimalistinen. Iso syöttökenttä. Taustakuvio.',
    defaultContent: {
      templateId: 'waitlist',
      hero: {
        title: 'Olemme tulossa pian',
        subtitle: 'Ole ensimmäisten joukossa. Ilmoita sähköpostisi ja saat eksklusiivisen pääsyn.',
        ctaText: 'Liity odotuslistalle',
        ctaLink: '#waitlist',
      },
      theme: {
        primaryColor: '#8B5CF6',
      },
    },
  },
  {
    id: 'saas-modern',
    name: 'SaaS Modern',
    description: 'Pitkä scrollaus. Hero -> Logot -> Ominaisuudet Grid -> UKK -> Footer.',
    defaultContent: {
      templateId: 'saas-modern',
      hero: {
        title: 'Muuta työtapasi kokonaan',
        subtitle: 'Nykyaikainen työkalupakki, joka tehostaa työskentelyäsi ja auttaa saavuttamaan enemmän.',
        ctaText: 'Kokeile ilmaiseksi',
        ctaLink: '#signup',
      },
      features: [
        {
          icon: '🚀',
          title: 'Nopea käyttöönotto',
          description: 'Aloita minuuteissa. Ei vaadi monimutkaista konfigurointia.',
        },
        {
          icon: '🔒',
          title: 'Turvallinen',
          description: 'Tietosi ovat turvassa. GDPR-yhteensopiva ja salattu.',
        },
        {
          icon: '📊',
          title: 'Täydelliset analytiikat',
          description: 'Seuraa suorituksiasi reaaliaikaisesti ja optimoi prosesseja.',
        },
        {
          icon: '👥',
          title: 'Tiimityöskentely',
          description: 'Työskentele yhdessä tehokkaasti. Aina ja kaikkialla.',
        },
        {
          icon: '⚡',
          title: 'Automaatio',
          description: 'Päästä irti toistuvista tehtävistä. Automaatio hoitaa työn.',
        },
        {
          icon: '🎨',
          title: 'Mukautettava',
          description: 'Sovita työkalu tarpeisiisi. Täysin joustava.',
        },
      ],
      faq: [
        {
          question: 'Kuinka paljon tämä maksaa?',
          answer: 'Tarjoamme 14 päivän ilmaisen kokeilun. Sen jälkeen hinnat alkavat 29€/kk.',
        },
        {
          question: 'Voinko peruuttaa milloin tahansa?',
          answer: 'Kyllä, voit peruuttaa tilauksesi milloin tahansa ilman velvoitteita.',
        },
        {
          question: 'Onko tämä turvallinen?',
          answer: 'Kyllä, käytämme teollisuuden standardeja tietosuojaan ja salaamme kaiken datan.',
        },
        {
          question: 'Tuenneko tiimiä?',
          answer: 'Kyllä, tarjoamme erilaisia hinnoitteluja tiimeille. Ota yhteyttä myyntiin.',
        },
      ],
      theme: {
        primaryColor: '#3B82F6',
      },
    },
  },
  {
    id: 'vsl',
    name: 'VSL (Video Sales Letter)',
    description: 'Otsikko -> Iso 16:9 Video Placeholder -> Iso Nappi alle.',
    defaultContent: {
      templateId: 'vsl',
      hero: {
        title: 'Oletko valmis muuttamaan elämäsi?',
        subtitle: 'Katso tämä video ja löydä ratkaisu, jota olet etsinyt.',
        ctaText: 'Katso video',
        ctaLink: '#video',
      },
      videoUrl: 'https://example.com/video.mp4',
      theme: {
        primaryColor: '#EF4444',
      },
    },
  },
  {
    id: 'personal',
    name: 'Personal',
    description: 'Pyöreä profiilikuva, "Tarinan" osio, suosittelut.',
    defaultContent: {
      templateId: 'personal',
      hero: {
        title: 'Hei, olen [Nimesi]',
        subtitle: 'Autan ihmisiä saavuttamaan unelmansa ja elämään täysipainoista elämää.',
        ctaText: 'Ota yhteyttä',
        ctaLink: '#contact',
      },
      about: {
        name: 'Matti Meikäläinen',
        bio: 'Olen kokenut valmentaja ja mentor, joka on auttanut satoja ihmisiä saavuttamaan tavoitteensa. Vuosien kokemukseni ja todistetut menetelmäni auttavat sinuakin eteenpäin.',
        image: '',
      },
      testimonials: [
        {
          name: 'Liisa Virtanen',
          text: 'Matin ohjaus muutti elämäni kokonaan. Suosittelen lämpimästi kaikille!',
          company: 'Yrittäjä',
        },
        {
          name: 'Jussi Korhonen',
          text: 'En olisi uskonut, että muutos voi olla näin nopeaa. Kiitos!',
          company: 'Toimitusjohtaja',
        },
        {
          name: 'Maria Lahti',
          text: 'Paras investointi, jonka olen koskaan tehnyt. Erityinen ja ammattimainen.',
          company: 'Vapaa-ammattilainen',
        },
      ],
      theme: {
        primaryColor: '#10B981',
      },
    },
  },
];

/**
 * Hakee templaten ID:n perusteella
 */
export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/**
 * Hakee oletustemplaten (saas-modern)
 */
export function getDefaultTemplate(): Template {
  return TEMPLATES.find((t) => t.id === 'saas-modern') || TEMPLATES[0];
}
