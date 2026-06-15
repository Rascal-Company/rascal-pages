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
  | "blog"
  | "cases"
  | "techStack"
  | "bento"
  | "footer";

export type HeroContent = {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image?: string;
  /** Optional small label shown above the headline (portfolio hero). */
  eyebrow?: string;
  /** Content alignment variant for the standard (non-portfolio) hero. */
  layout?: "centered" | "left";
  fieldOrder?: string[];
  // Embedded form options
  showForm?: boolean;
  formFields?: FormField[];
  formSubmitButtonText?: string;
  formWebhookUrl?: string;
  formSuccessMessage?: {
    title: string;
    description: string;
  };
  // DEPRECATED: Use formFields instead
  collectName?: boolean;
};

export type FeatureItem = {
  icon: string;
  title: string;
  description: string;
  image?: string;
  fieldOrder?: string[];
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
  fieldOrder?: string[];
};

export type AboutContent = {
  name: string;
  bio: string;
  image?: string;
  fieldOrder?: string[];
};

export type VideoContent = {
  url: string;
};

export type FormFieldType = "email" | "text" | "textarea" | "checkbox";

export type FormField = {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  name: string;
};

export type FormContent = {
  fields: FormField[];
  formTitle?: string;
  submitButtonText?: string;
  webhookUrl?: string;
  successMessage: {
    title: string;
    description: string;
  };
};

export type LogosContent = null;
export type FooterContent = null;

/**
 * Blog listing section. Actual posts are loaded from the `posts` table at
 * render time; this content only configures the heading and how many of the
 * latest posts to surface on the page.
 */
export type BlogContent = {
  heading: string;
  subheading?: string;
  postsToShow: number;
};

/**
 * A single measurable outcome shown as a stat on a case card,
 * e.g. { value: "8–10h", label: "Aikasäästö / viikko" }.
 */
export type CaseOutcome = {
  value: string;
  label: string;
};

/**
 * One portfolio work / project shown as a card in the `cases` section.
 * Profession-agnostic: works for any portfolio (design, photography,
 * consulting, development, …). Renders inline; no separate detail routes.
 */
export type CaseItem = {
  title: string;
  tagline: string;
  summary: string;
  image?: string;
  /** Keyword chips (skills, tools, tags) rendered under the summary. */
  tags: string[];
  /** Headline metrics rendered as a small stat row. */
  outcomes: CaseOutcome[];
  linkLabel?: string;
  linkUrl?: string;
  fieldOrder?: string[];
};

/**
 * Projects / case studies showcase section.
 */
export type CasesContent = {
  heading: string;
  subheading?: string;
  items: CaseItem[];
  /** Number of columns for the case grid on large screens. Defaults to 2. */
  columns?: 2 | 3;
};

/**
 * A named group of skills/services/items, e.g.
 * { group: "Palvelut", items: ["Konsultointi", "Suunnittelu"] }.
 */
export type TechStackGroup = {
  group: string;
  items: string[];
};

/**
 * General "expertise" section grouped by area — services, skills, tools or
 * specialties. Profession-agnostic; the heading (e.g. "Osaaminen",
 * "Palvelut", "Teknologiat") is set per site.
 */
export type TechStackContent = {
  heading: string;
  subheading?: string;
  groups: TechStackGroup[];
};

/**
 * One element placed on the bento grid. Free-form fields are interpreted per
 * `type`: heading/text/button use `text`; image/button use `url`; stat uses
 * `value` + `label`; card uses `text` (title) + `body` + `tags` (+ optional
 * `url`/`label` link). Placement is on a 12-column grid.
 */
export type BentoElementType =
  | "heading"
  | "text"
  | "image"
  | "button"
  | "stat"
  | "card";

export type BentoItem = {
  id: string;
  type: BentoElementType;
  text?: string;
  url?: string;
  value?: string;
  label?: string;
  /** Card body copy (rendered under the card title). */
  body?: string;
  /** Card keyword chips. */
  tags?: string[];
  /** Render the element on a raised card surface. Defaults per type. */
  boxed?: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
};

/**
 * Squarespace-style bento grid: free-form draggable/resizable boxes on a
 * 12-column snap grid, each holding a single element.
 */
export type BentoContent = {
  items: BentoItem[];
};

export type SectionContentMap = {
  hero: HeroContent;
  features: FeatureItem[];
  faq: FaqItem[];
  testimonials: TestimonialItem[];
  about: AboutContent;
  video: VideoContent;
  form: FormContent;
  logos: LogosContent;
  blog: BlogContent;
  cases: CasesContent;
  techStack: TechStackContent;
  bento: BentoContent;
  footer: FooterContent;
};

export type Section<T extends SectionType = SectionType> = {
  id: SectionId;
  type: T;
  content: SectionContentMap[T];
  isVisible: boolean;
  /** Per-section layout/style overrides applied around the rendered block. */
  style?: SectionStyle;
};

/**
 * Per-section presentation overrides, applied by the renderer as a wrapper
 * around the block. All fields are optional; unset means the block's own
 * default styling is used.
 */
export type SectionStyle = {
  /** Background color (CSS color) for the whole section band. */
  background?: string;
  /** Extra vertical padding around the section. */
  paddingY?: "none" | "sm" | "md" | "lg";
  /** Text alignment for the section content. */
  align?: "left" | "center" | "right";
  /** Content width: the block default, or a narrower centered column. */
  width?: "default" | "narrow";
};

export type ThemeConfig = {
  primaryColor: string;
  headingFont?: string;
  bodyFont?: string;
  /**
   * Visual appearance of the rendered site. "dark" switches blocks to the
   * polished dark portfolio look; templates that omit this stay light.
   */
  appearance?: "light" | "dark";
  /**
   * Per-site color palette. Any field left unset is derived from
   * `primaryColor` + `appearance` defaults by the site theme engine
   * (`src/lib/site-theme.ts`), so existing sites keep their look.
   */
  palette?: SitePalette;
  /** Corner radius for the site (CSS length, e.g. "0.5rem"). */
  radius?: string;
};

/**
 * Per-site design tokens mirroring the @rascal/theme contract, but with values
 * chosen by the end customer (not the Rascal brand). Injected as CSS variables
 * on the rendered site root by the site theme engine.
 */
export type SitePalette = {
  primary?: string;
  primaryForeground?: string;
  background?: string;
  foreground?: string;
  muted?: string;
  mutedForeground?: string;
  card?: string;
  cardForeground?: string;
  border?: string;
};

/**
 * Per-page SEO overrides. When a field is unset, metadata is derived from the
 * page content (about/hero). Stored on TemplateConfig so it travels with the
 * page content and is saved through the normal page-save flow.
 */
export type SeoConfig = {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
};

export type TemplateConfig = {
  templateId: string;
  theme: ThemeConfig;
  sections: Section[];
  seo?: SeoConfig;
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
          fields: [
            {
              id: "field-email-1",
              type: "email" as const,
              label: "Sähköpostiosoite",
              placeholder: "nimi@esimerkki.fi",
              required: true,
              name: "email",
            },
            {
              id: "field-name-1",
              type: "text" as const,
              label: "Nimi",
              placeholder: "Etunimesi",
              required: false,
              name: "name",
            },
            {
              id: "field-consent-1",
              type: "checkbox" as const,
              label:
                "Haluan vastaanottaa markkinointiviestejä ja uutisia sähköpostiini.",
              required: false,
              name: "marketingConsent",
            },
          ],
          submitButtonText: "Lataa nyt ilmaiseksi",
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
          fields: [
            {
              id: "field-email-1",
              type: "email" as const,
              label: "Sähköpostiosoite",
              placeholder: "nimi@esimerkki.fi",
              required: true,
              name: "email",
            },
            {
              id: "field-name-1",
              type: "text" as const,
              label: "Nimi",
              placeholder: "Etunimesi",
              required: false,
              name: "name",
            },
            {
              id: "field-consent-1",
              type: "checkbox" as const,
              label:
                "Haluan vastaanottaa markkinointiviestejä ja uutisia sähköpostiini.",
              required: false,
              name: "marketingConsent",
            },
          ],
          submitButtonText: "Liity odotuslistalle",
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
  {
    id: "personal-brand",
    name: "Henkilöbrändi + Blogi",
    description:
      "SEO-henkilöbrändi: hero, yhteenveto 'mitä tapahtuu' -osio ja blogi uusimmilla julkaisuilla.",
    defaultContent: {
      templateId: "personal-brand",
      theme: { primaryColor: "#0EA5E9" },
      sections: [
        createSection("pb-hero-1", "hero", {
          title: "Hei, olen [Nimesi]",
          subtitle:
            "Kirjoitan ja jaan ajatuksiani aiheesta X. Tältä sivulta näet mitä teen juuri nyt ja luet uusimmat kirjoitukseni.",
          ctaText: "Lue blogia",
          ctaLink: "#blogi",
        }),
        createSection("pb-about-1", "about", {
          name: "[Nimesi]",
          bio: "Lyhyt yhteenveto siitä mitä teen juuri nyt: projektit, fokus ja missä minut tavoittaa. Päivitä tätä säännöllisesti, niin sivu pysyy tuoreena.",
          image: "",
        }),
        createSection("pb-blog-1", "blog", {
          heading: "Uusimmat kirjoitukset",
          subheading: "Ajatuksia, oppeja ja kuulumisia.",
          postsToShow: 6,
        }),
        createSection("pb-footer-1", "footer", null),
      ],
    },
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description:
      "Henkilökohtainen portfolio: hero, tarina, teknologiat, projektit (caset), blogi ja yhteydenotto.",
    defaultContent: {
      templateId: "portfolio",
      theme: {
        primaryColor: "#3b82f6",
        appearance: "dark",
        headingFont: "Inter",
        bodyFont: "Inter",
      },
      sections: [
        createSection("pf-hero-1", "hero", {
          title: "Hei, olen [Nimesi]",
          subtitle:
            "Esittelen työtäni ja kerron kuka olen. Tältä sivulta näet projektini, osaamiseni ja uusimmat kuulumiseni.",
          ctaText: "Katso työni",
          ctaLink: "#projektit",
        }),
        createSection("pf-about-1", "about", {
          name: "Tarina",
          bio: "Lyhyt kuvaus siitä kuka olet, mitä teet ja mikä sinua ajaa. Kerro taustasi ja missä olet juuri nyt — pidä teksti henkilökohtaisena ja tuoreena.",
          image: "",
        }),
        createSection("pf-techstack-1", "techStack", {
          heading: "Osaaminen",
          subheading: "Mitä teen ja missä olen vahvimmillani.",
          groups: [
            {
              group: "Palvelut",
              items: ["Konsultointi", "Suunnittelu", "Toteutus"],
            },
            { group: "Erikoisalat", items: ["Strategia", "Sisältö"] },
          ],
        }),
        createSection("pf-cases-1", "cases", {
          heading: "Työt",
          subheading: "Valikoima työtä, josta olen ylpeä.",
          items: [
            {
              title: "Työn nimi",
              tagline: "Lyhyt iskulause työstä",
              summary:
                "Kuvaa muutamalla lauseella mitä teit, kenelle ja minkä tuloksen se tuotti.",
              image: "",
              tags: ["Avainsana", "Avainsana"],
              outcomes: [
                { value: "+40 %", label: "Kasvua tuloksissa" },
                { value: "12", label: "Tyytyväistä asiakasta" },
              ],
              linkLabel: "Katso lisää",
              linkUrl: "#",
            },
            {
              title: "Toinen työ",
              tagline: "Mitä tämä työ piti sisällään",
              summary:
                "Toinen esimerkki työstäsi. Korvaa omilla töilläsi ja lisää tarvittaessa kuvat ja linkit.",
              image: "",
              tags: ["Avainsana"],
              outcomes: [{ value: "Valmis", label: "Julkaistu lopputulos" }],
              linkLabel: "Lue lisää",
              linkUrl: "#",
            },
          ],
        }),
        createSection("pf-blog-1", "blog", {
          heading: "Uusimmat kirjoitukset",
          subheading: "Ajatuksia, oppeja ja kuulumisia.",
          postsToShow: 6,
        }),
        createSection("pf-form-1", "form", {
          fields: [
            {
              id: "field-name-1",
              type: "text" as const,
              label: "Nimi",
              placeholder: "Nimesi",
              required: true,
              name: "name",
            },
            {
              id: "field-email-1",
              type: "email" as const,
              label: "Sähköpostiosoite",
              placeholder: "nimi@esimerkki.fi",
              required: true,
              name: "email",
            },
            {
              id: "field-message-1",
              type: "textarea" as const,
              label: "Viesti",
              placeholder: "Kerro lyhyesti mistä on kyse",
              required: false,
              name: "message",
            },
          ],
          formTitle: "Ota yhteyttä",
          submitButtonText: "Lähetä viesti",
          successMessage: {
            title: "Kiitos viestistäsi!",
            description: "Palaan sinulle pian.",
          },
        }),
        createSection("pf-footer-1", "footer", null),
      ],
    },
  },
];

/**
 * Parse a comma-separated chip input ("React, Supabase, ") into a clean,
 * de-duplicated list, dropping blanks. Used by the cases/tech-stack editors.
 */
export function parseTagList(input: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of input.split(",")) {
    const tag = raw.trim();
    if (tag.length === 0 || seen.has(tag)) continue;
    seen.add(tag);
    result.push(tag);
  }
  return result;
}

/**
 * Render a tag list back into the comma-separated form shown in the editor.
 */
export function formatTagList(tags: string[]): string {
  return tags.join(", ");
}

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
  blog: "Blogi",
  cases: "Projektit",
  techStack: "Osaaminen",
  bento: "Ruudukko",
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
  "blog",
  "cases",
  "techStack",
  "bento",
  "footer",
];
