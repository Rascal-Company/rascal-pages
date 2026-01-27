/**
 * Template-konfiguraatio - Single Source of Truth
 * Defines available landing page templates and their fields
 */

import type { SectionId } from "./types";

export type SectionType =
  | "hero"
  | "features"
  | "faq"
  | "testimonials"
  | "about"
  | "video"
  | "form"
  | "logos"
  | "footer";

export type HeroContent = {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image?: string;
  // Embedded form options
  showForm?: boolean;
  collectName?: boolean;
  formSuccessMessage?: {
    title: string;
    description: string;
  };
};

export type FeatureItem = {
  icon: string;
  title: string;
  description: string;
  image?: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type TestimonialItem = {
  name: string;
  text: string;
  company?: string;
  avatar?: string;
};

export type AboutContent = {
  name: string;
  bio: string;
  image?: string;
};

export type VideoContent = {
  url: string;
};

export type FormContent = {
  successMessage: {
    title: string;
    description: string;
  };
};

export type LogosContent = null;
export type FooterContent = null;

export type SectionContentMap = {
  hero: HeroContent;
  features: FeatureItem[];
  faq: FaqItem[];
  testimonials: TestimonialItem[];
  about: AboutContent;
  video: VideoContent;
  form: FormContent;
  logos: LogosContent;
  footer: FooterContent;
};

export type Section<T extends SectionType = SectionType> = {
  id: SectionId;
  type: T;
  content: SectionContentMap[T];
  isVisible: boolean;
};

export type TemplateConfig = {
  templateId: string;
  theme: {
    primaryColor: string;
  };
  sections: Section[];
  // DEPRECATED: Keep for migration, remove later
  hero?: HeroContent;
  features?: FeatureItem[];
  faq?: FaqItem[];
  testimonials?: TestimonialItem[];
  about?: AboutContent;
  videoUrl?: string;
  successMessage?: { title: string; description: string };
};

export type Template = {
  id: string;
  name: string;
  description: string;
  defaultContent: TemplateConfig;
};

/**
 * Helper to create a section with proper typing
 */
function createSection<T extends SectionType>(
  id: string,
  type: T,
  content: SectionContentMap[T],
  isVisible = true,
): Section<T> {
  return {
    id: id as SectionId,
    type,
    content,
    isVisible,
  };
}

export const TEMPLATES: Template[] = [
  {
    id: "lead-magnet",
    name: "E-kirja / Lead Magnet",
    description:
      "Optimaalinen konversion kannalta. Vasemmalla teksti/pisteet, oikealla lomake/kuva.",
    defaultContent: {
      templateId: "lead-magnet",
      theme: { primaryColor: "#3B82F6" },
      sections: [
        createSection("lm-hero-1", "hero", {
          title: "Lataa ilmainen E-kirja",
          subtitle:
            "Opit tärkeimmät vinkit ja strategiat jo tänään. Aloita heti!",
          ctaText: "Lataa nyt ilmaiseksi",
          ctaLink: "#download",
        }),
        createSection("lm-features-1", "features", [
          {
            icon: "📚",
            title: "Yli 50 sivua käytännön vinkkejä",
            description:
              "Saat välittömästi toimivia strategioita, joita voit soveltaa heti.",
          },
          {
            icon: "⚡",
            title: "Aloita heti",
            description:
              "Ei vaadi erityistä osaamista. Kaikki selitetty yksinkertaisesti.",
          },
          {
            icon: "🎯",
            title: "Todistettu menetelmä",
            description:
              "Tuhannet ovat jo hyötyneet tästä oppaasta. Olet seuraava.",
          },
        ]),
        createSection("lm-form-1", "form", {
          successMessage: {
            title: "Kiitos! Tietosi on tallennettu.",
            description: "Saat pian lisätietoja sähköpostiisi.",
          },
        }),
        createSection("lm-footer-1", "footer", null),
      ],
    },
  },
  {
    id: "waitlist",
    name: "Odotuslista",
    description: "Keskitetty, minimalistinen. Iso syöttökenttä. Taustakuvio.",
    defaultContent: {
      templateId: "waitlist",
      theme: { primaryColor: "#8B5CF6" },
      sections: [
        createSection("wl-hero-1", "hero", {
          title: "Olemme tulossa pian",
          subtitle:
            "Ole ensimmäisten joukossa. Ilmoita sähköpostisi ja saat eksklusiivisen pääsyn.",
          ctaText: "Liity odotuslistalle",
          ctaLink: "#waitlist",
        }),
        createSection("wl-form-1", "form", {
          successMessage: {
            title: "Kiitos! Olet nyt odotuslistalla.",
            description: "Saat pian lisätietoja sähköpostiisi.",
          },
        }),
        createSection("wl-footer-1", "footer", null),
      ],
    },
  },
  {
    id: "saas-modern",
    name: "SaaS Modern",
    description:
      "Pitkä scrollaus. Hero -> Logot -> Ominaisuudet Grid -> UKK -> Footer.",
    defaultContent: {
      templateId: "saas-modern",
      theme: { primaryColor: "#3B82F6" },
      sections: [
        createSection("sm-hero-1", "hero", {
          title: "Muuta työtapasi kokonaan",
          subtitle:
            "Nykyaikainen työkalupakki, joka tehostaa työskentelyäsi ja auttaa saavuttamaan enemmän.",
          ctaText: "Kokeile ilmaiseksi",
          ctaLink: "#signup",
        }),
        createSection("sm-logos-1", "logos", null),
        createSection("sm-features-1", "features", [
          {
            icon: "🚀",
            title: "Nopea käyttöönotto",
            description:
              "Aloita minuuteissa. Ei vaadi monimutkaista konfigurointia.",
          },
          {
            icon: "🔒",
            title: "Turvallinen",
            description: "Tietosi ovat turvassa. GDPR-yhteensopiva ja salattu.",
          },
          {
            icon: "📊",
            title: "Täydelliset analytiikat",
            description:
              "Seuraa suorituksiasi reaaliaikaisesti ja optimoi prosesseja.",
          },
          {
            icon: "👥",
            title: "Tiimityöskentely",
            description: "Työskentele yhdessä tehokkaasti. Aina ja kaikkialla.",
          },
          {
            icon: "⚡",
            title: "Automaatio",
            description:
              "Päästä irti toistuvista tehtävistä. Automaatio hoitaa työn.",
          },
          {
            icon: "🎨",
            title: "Mukautettava",
            description: "Sovita työkalu tarpeisiisi. Täysin joustava.",
          },
        ]),
        createSection("sm-faq-1", "faq", [
          {
            question: "Kuinka paljon tämä maksaa?",
            answer:
              "Tarjoamme 14 päivän ilmaisen kokeilun. Sen jälkeen hinnat alkavat 29€/kk.",
          },
          {
            question: "Voinko peruuttaa milloin tahansa?",
            answer:
              "Kyllä, voit peruuttaa tilauksesi milloin tahansa ilman velvoitteita.",
          },
          {
            question: "Onko tämä turvallinen?",
            answer:
              "Kyllä, käytämme teollisuuden standardeja tietosuojaan ja salaamme kaiken datan.",
          },
          {
            question: "Tuenneko tiimiä?",
            answer:
              "Kyllä, tarjoamme erilaisia hinnoitteluja tiimeille. Ota yhteyttä myyntiin.",
          },
        ]),
        createSection("sm-footer-1", "footer", null),
      ],
    },
  },
  {
    id: "vsl",
    name: "VSL (Video Sales Letter)",
    description: "Otsikko -> Iso 16:9 Video Placeholder -> Iso Nappi alle.",
    defaultContent: {
      templateId: "vsl",
      theme: { primaryColor: "#EF4444" },
      sections: [
        createSection("vsl-hero-1", "hero", {
          title: "Oletko valmis muuttamaan elämäsi?",
          subtitle: "Katso tämä video ja löydä ratkaisu, jota olet etsinyt.",
          ctaText: "Katso video",
          ctaLink: "#video",
        }),
        createSection("vsl-video-1", "video", {
          url: "https://example.com/video.mp4",
        }),
        createSection("vsl-footer-1", "footer", null),
      ],
    },
  },
  {
    id: "personal",
    name: "Personal",
    description: 'Pyöreä profiilikuva, "Tarinan" osio, suosittelut.',
    defaultContent: {
      templateId: "personal",
      theme: { primaryColor: "#10B981" },
      sections: [
        createSection("per-hero-1", "hero", {
          title: "Hei, olen [Nimesi]",
          subtitle:
            "Autan ihmisiä saavuttamaan unelmansa ja elämään täysipainoista elämää.",
          ctaText: "Ota yhteyttä",
          ctaLink: "#contact",
        }),
        createSection("per-about-1", "about", {
          name: "Matti Meikäläinen",
          bio: "Olen kokenut valmentaja ja mentor, joka on auttanut satoja ihmisiä saavuttamaan tavoitteensa. Vuosien kokemukseni ja todistetut menetelmäni auttavat sinuakin eteenpäin.",
          image: "",
        }),
        createSection("per-testimonials-1", "testimonials", [
          {
            name: "Liisa Virtanen",
            text: "Matin ohjaus muutti elämäni kokonaan. Suosittelen lämpimästi kaikille!",
            company: "Yrittäjä",
          },
          {
            name: "Jussi Korhonen",
            text: "En olisi uskonut, että muutos voi olla näin nopeaa. Kiitos!",
            company: "Toimitusjohtaja",
          },
          {
            name: "Maria Lahti",
            text: "Paras investointi, jonka olen koskaan tehnyt. Erityinen ja ammattimainen.",
            company: "Vapaa-ammattilainen",
          },
        ]),
        createSection("per-footer-1", "footer", null),
      ],
    },
  },
];

/**
 * Gets template by ID
 */
export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/**
 * Gets default template (saas-modern)
 */
export function getDefaultTemplate(): Template {
  return TEMPLATES.find((t) => t.id === "saas-modern") || TEMPLATES[0];
}

/**
 * Section type display names for UI
 */
export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  hero: "Pääosio",
  features: "Ominaisuudet",
  faq: "UKK",
  testimonials: "Suosittelut",
  about: "Tietoa",
  video: "Video",
  form: "Lomake",
  logos: "Logot",
  footer: "Alapalkki",
};

/**
 * Section types that can be added by users
 */
export const ADDABLE_SECTION_TYPES: SectionType[] = [
  "hero",
  "features",
  "faq",
  "testimonials",
  "about",
  "video",
  "form",
  "logos",
  "footer",
];
