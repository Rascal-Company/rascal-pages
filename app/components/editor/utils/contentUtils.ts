import { nanoid } from "nanoid";
import type {
  TemplateConfig,
  Section,
  SectionType,
  HeroContent,
  FeatureItem,
  FaqItem,
  TestimonialItem,
  AboutContent,
  FormContent,
  VideoContent,
  SectionContentMap,
} from "@/src/lib/templates";
import { getDefaultTemplate, getTemplateById } from "@/src/lib/templates";
import type { SectionId } from "@/src/lib/types";

type LegacyHeroContent = HeroContent & { cta?: string };

type LegacyContent = {
  templateId?: string;
  theme?: { primaryColor: string };
  hero?: LegacyHeroContent;
  features?: FeatureItem[];
  faq?: FaqItem[];
  testimonials?: TestimonialItem[];
  about?: AboutContent;
  videoUrl?: string;
  successMessage?: { title: string; description: string };
  sections?: Section[];
};

/**
 * Check if content has been migrated to section-based format
 */
function hasSections(
  content: LegacyContent | TemplateConfig,
): content is TemplateConfig {
  return (
    Array.isArray(content.sections) &&
    content.sections.length > 0
  );
}

/**
 * Migrate old fixed-field content to section-based format
 */
export function migrateToSections(
  content: LegacyContent | TemplateConfig | null | undefined,
): TemplateConfig {
  // Handle null/undefined content
  if (!content || typeof content !== "object") {
    const defaultTemplate = getDefaultTemplate();
    return defaultTemplate.defaultContent;
  }

  if (hasSections(content)) {
    return content;
  }

  const legacy = content as LegacyContent;
  const sections: Section[] = [];

  if (legacy.hero) {
    sections.push(createSection("hero", legacy.hero));
  }

  if (legacy.features && legacy.features.length > 0) {
    sections.push(createSection("features", legacy.features));
  }

  if (legacy.faq && legacy.faq.length > 0) {
    sections.push(createSection("faq", legacy.faq));
  }

  if (legacy.testimonials && legacy.testimonials.length > 0) {
    sections.push(createSection("testimonials", legacy.testimonials));
  }

  if (legacy.about) {
    sections.push(createSection("about", legacy.about));
  }

  if (legacy.videoUrl) {
    sections.push(createSection("video", { url: legacy.videoUrl }));
  }

  if (legacy.successMessage) {
    sections.push(
      createSection("form", {
        successMessage: legacy.successMessage,
      }),
    );
  }

  sections.push(createSection("footer", null));

  return {
    templateId: legacy.templateId || "saas-modern",
    theme: legacy.theme || { primaryColor: "#3B82F6" },
    sections,
  };
}

/**
 * Create a section with a unique ID
 */
export function createSection<T extends SectionType>(
  type: T,
  content: SectionContentMap[T],
  isVisible = true,
): Section<T> {
  return {
    id: nanoid() as SectionId,
    type,
    content,
    isVisible,
  };
}

/**
 * Get default content for a section type
 */
export function getDefaultSectionContent<T extends SectionType>(
  type: T,
): SectionContentMap[T] {
  const defaults: Record<SectionType, SectionContentMap[SectionType]> = {
    hero: {
      title: "Otsikko",
      subtitle: "Alaotsikko",
      ctaText: "Toimintokutsu",
      ctaLink: "#",
    },
    features: [
      {
        icon: "⭐",
        title: "Ominaisuus",
        description: "Kuvaus ominaisuudesta",
      },
    ],
    faq: [{ question: "Kysymys?", answer: "Vastaus." }],
    testimonials: [{ name: "Nimi", text: "Suosittelu", company: "Yritys" }],
    about: { name: "Nimi", bio: "Tietoa itsestäni" },
    video: { url: "" },
    form: {
      successMessage: {
        title: "Kiitos!",
        description: "Tietosi on tallennettu.",
      },
    },
    logos: null,
    footer: null,
  };

  return defaults[type] as SectionContentMap[T];
}

/**
 * Normalize content - ensure templateId exists and migrate to sections
 */
export function normalizeContent(
  content: LegacyContent | TemplateConfig | null | undefined,
): TemplateConfig {
  // Handle null/undefined content
  if (!content || typeof content !== "object") {
    const defaultTemplate = getDefaultTemplate();
    return defaultTemplate.defaultContent;
  }

  if (!content.templateId) {
    const legacy = content as LegacyContent;
    const defaultTemplate = getDefaultTemplate();
    const defaultHero = defaultTemplate.defaultContent.sections.find(
      (s) => s.type === "hero",
    )?.content as HeroContent;
    const defaultFeatures = defaultTemplate.defaultContent.sections.find(
      (s) => s.type === "features",
    )?.content as FeatureItem[];

    const merged: LegacyContent = {
      ...defaultTemplate.defaultContent,
      hero: {
        ...defaultHero,
        ...legacy.hero,
        ctaText:
          legacy.hero?.cta ||
          legacy.hero?.ctaText ||
          defaultHero?.ctaText,
      },
      features: legacy.features || defaultFeatures || [],
      theme: legacy.theme || defaultTemplate.defaultContent.theme,
    };
    return migrateToSections(merged);
  }

  return migrateToSections(content);
}

/**
 * Merge old data with new template - preserve as much as possible
 */
export function mergeTemplateContent(
  currentContent: TemplateConfig,
  newTemplateId: string,
): TemplateConfig | null {
  const newTemplate = getTemplateById(newTemplateId);
  if (!newTemplate) return null;

  const currentHeroSection = currentContent.sections.find(
    (s) => s.type === "hero",
  );
  const currentHero = currentHeroSection?.content as HeroContent | undefined;
  const newHeroSection = newTemplate.defaultContent.sections.find(
    (s) => s.type === "hero",
  );
  const newHero = newHeroSection?.content as HeroContent;

  const newSections = newTemplate.defaultContent.sections.map((section) => {
    if (section.type === "hero" && currentHero) {
      return {
        ...section,
        id: nanoid() as SectionId,
        content: {
          ...newHero,
          title: currentHero.title || newHero.title,
          subtitle: currentHero.subtitle || newHero.subtitle,
          ctaText: currentHero.ctaText || newHero.ctaText,
          ctaLink: currentHero.ctaLink || newHero.ctaLink,
        },
      };
    }

    const existingSection = currentContent.sections.find(
      (s) => s.type === section.type,
    );
    if (existingSection && section.type !== "hero") {
      return {
        ...section,
        id: nanoid() as SectionId,
        content: existingSection.content,
      };
    }

    return { ...section, id: nanoid() as SectionId };
  });

  return {
    templateId: newTemplateId,
    theme: currentContent.theme || newTemplate.defaultContent.theme,
    sections: newSections as Section[],
  };
}
