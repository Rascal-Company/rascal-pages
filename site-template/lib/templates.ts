/**
 * Template config types — Single Source of Truth for rendered content shape.
 * Ported from the Rascal Pages app (src/lib/templates.ts), trimmed to the
 * types + a personal-brand fallback. The standalone site reads its actual
 * content from `content/site.json`; this fallback is only used when that file
 * is missing or incomplete.
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
  | "footer";

export type HeroContent = {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  image?: string;
  fieldOrder?: string[];
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
  successMessage: { title: string; description: string };
};

export type LogosContent = null;
export type FooterContent = null;

/**
 * Blog listing section. Posts are loaded from `content/posts/*.md` at build
 * time; this content only configures the heading and how many posts to surface.
 */
export type BlogContent = {
  heading: string;
  subheading?: string;
  postsToShow: number;
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
  footer: FooterContent;
};

/**
 * A rendered section. `content` is intentionally `unknown`: the shape depends on
 * `type`, and the renderer narrows it per type (see SiteRenderer). This keeps
 * the type tolerant of content loaded from JSON.
 */
export type Section = {
  id: SectionId;
  type: SectionType;
  content: unknown;
  isVisible: boolean;
};

export type ThemeConfig = {
  primaryColor: string;
  headingFont?: string;
  bodyFont?: string;
};

export type TemplateConfig = {
  templateId: string;
  theme: ThemeConfig;
  sections: Section[];
};

/**
 * Fallback content used when `content/site.json` is missing. Mirrors the
 * `personal-brand` template from the source app.
 */
export const PERSONAL_BRAND_FALLBACK: TemplateConfig = {
  templateId: "personal-brand",
  theme: { primaryColor: "#0EA5E9", headingFont: "Inter", bodyFont: "Inter" },
  sections: [
    {
      id: "pb-hero-1" as SectionId,
      type: "hero",
      isVisible: true,
      content: {
        title: "Hei, olen [Nimesi]",
        subtitle:
          "Kirjoitan ja jaan ajatuksiani aiheesta X. Tältä sivulta näet mitä teen juuri nyt ja luet uusimmat kirjoitukseni.",
        ctaText: "Lue blogia",
        ctaLink: "#blogi",
      },
    },
    {
      id: "pb-about-1" as SectionId,
      type: "about",
      isVisible: true,
      content: {
        name: "[Nimesi]",
        bio: "Lyhyt yhteenveto siitä mitä teen juuri nyt: projektit, fokus ja missä minut tavoittaa.",
        image: "",
      },
    },
    {
      id: "pb-blog-1" as SectionId,
      type: "blog",
      isVisible: true,
      content: {
        heading: "Uusimmat kirjoitukset",
        subheading: "Ajatuksia, oppeja ja kuulumisia.",
        postsToShow: 6,
      },
    },
    {
      id: "pb-footer-1" as SectionId,
      type: "footer",
      isVisible: true,
      content: null,
    },
  ],
};
