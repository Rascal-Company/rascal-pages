import { TemplateConfig, getDefaultTemplate, getTemplateById } from '@/src/lib/templates';

/**
 * Normalisoi content - varmista että templateId on olemassa
 */
export function normalizeContent(content: any): TemplateConfig {
  if (!content.templateId) {
    const defaultTemplate = getDefaultTemplate();
    return {
      ...defaultTemplate.defaultContent,
      hero: {
        ...defaultTemplate.defaultContent.hero,
        ...content.hero,
        ctaText: content.hero?.cta || content.hero?.ctaText || defaultTemplate.defaultContent.hero.ctaText,
        cta: content.hero?.cta || content.hero?.ctaText || defaultTemplate.defaultContent.hero.ctaText,
      },
      features: content.features || defaultTemplate.defaultContent.features || [],
      theme: content.theme || defaultTemplate.defaultContent.theme,
    };
  }
  return content as TemplateConfig;
}

/**
 * Yhdistä vanha data uuteen templateen - yritä säilyttää mahdollisimman paljon
 */
export function mergeTemplateContent(
  currentContent: TemplateConfig,
  newTemplateId: string
): TemplateConfig | null {
  const newTemplate = getTemplateById(newTemplateId);
  if (!newTemplate) return null;

  return {
    ...newTemplate.defaultContent,
    hero: {
      ...newTemplate.defaultContent.hero,
      // Säilytä vanhat hero-kentät jos ne ovat yhteensopivia
      title: currentContent.hero?.title || newTemplate.defaultContent.hero.title,
      subtitle: currentContent.hero?.subtitle || newTemplate.defaultContent.hero.subtitle,
      ctaText: currentContent.hero?.ctaText || newTemplate.defaultContent.hero.ctaText,
      ctaLink: currentContent.hero?.ctaLink || newTemplate.defaultContent.hero.ctaLink,
    },
    theme: currentContent.theme || newTemplate.defaultContent.theme,
    // Säilytä features jos uusi template tukee niitä
    features: newTemplate.defaultContent.features
      ? currentContent.features || newTemplate.defaultContent.features
      : newTemplate.defaultContent.features,
    // Säilytä muut kentät jos ne ovat yhteensopivia
    videoUrl: currentContent.videoUrl || newTemplate.defaultContent.videoUrl,
    about: currentContent.about || newTemplate.defaultContent.about,
    testimonials: currentContent.testimonials || newTemplate.defaultContent.testimonials,
    faq: currentContent.faq || newTemplate.defaultContent.faq,
  };
}
