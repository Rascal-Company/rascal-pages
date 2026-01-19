import { TemplateConfig } from '@/src/lib/templates';

type ContentUpdater = (prev: TemplateConfig) => TemplateConfig;

/**
 * Helper function to update nested fields in content
 */
export function updateField(
  section: string,
  key: string,
  value: any
): ContentUpdater {
  return (prev: TemplateConfig) => {
    if (section === 'root') {
      return { ...prev, [key]: value };
    }
    if (section === 'hero') {
      return {
        ...prev,
        hero: { ...prev.hero, [key]: value },
      };
    }
    if (section === 'theme') {
      return {
        ...prev,
        theme: { ...(prev.theme || {}), [key]: value },
      };
    }
    return prev;
  };
}

/**
 * Update hero field
 */
export function updateHeroField(key: string, value: string): ContentUpdater {
  return updateField('hero', key, value);
}

/**
 * Update theme field
 */
export function updateThemeField(key: string, value: string): ContentUpdater {
  return updateField('theme', key, value);
}

/**
 * Add a new feature
 */
export function addFeature(): ContentUpdater {
  return (prev: TemplateConfig) => ({
    ...prev,
    features: [
      ...(prev.features || []),
      { icon: '⭐', title: 'Uusi ominaisuus', description: 'Kuvaus' },
    ],
  });
}

/**
 * Remove a feature by index
 */
export function removeFeature(index: number): ContentUpdater {
  return (prev: TemplateConfig) => ({
    ...prev,
    features: (prev.features || []).filter((_, i) => i !== index),
  });
}

/**
 * Update a feature field
 */
export function updateFeature(
  index: number,
  field: string,
  value: string
): ContentUpdater {
  return (prev: TemplateConfig) => ({
    ...prev,
    features: (prev.features || []).map((feature, i) =>
      i === index ? { ...feature, [field]: value } : feature
    ),
  });
}

/**
 * Add a new testimonial
 */
export function addTestimonial(): ContentUpdater {
  return (prev: TemplateConfig) => ({
    ...prev,
    testimonials: [
      ...(prev.testimonials || []),
      { name: 'Nimi', text: 'Suosittelu', company: 'Yritys' },
    ],
  });
}

/**
 * Remove a testimonial by index
 */
export function removeTestimonial(index: number): ContentUpdater {
  return (prev: TemplateConfig) => ({
    ...prev,
    testimonials: (prev.testimonials || []).filter((_, i) => i !== index),
  });
}

/**
 * Update a testimonial field
 */
export function updateTestimonial(
  index: number,
  field: string,
  value: string
): ContentUpdater {
  return (prev: TemplateConfig) => ({
    ...prev,
    testimonials: (prev.testimonials || []).map((testimonial, i) =>
      i === index ? { ...testimonial, [field]: value } : testimonial
    ),
  });
}

/**
 * Add a new FAQ item
 */
export function addFaq(): ContentUpdater {
  return (prev: TemplateConfig) => ({
    ...prev,
    faq: [
      ...(prev.faq || []),
      { question: 'Kysymys?', answer: 'Vastaus' },
    ],
  });
}

/**
 * Remove an FAQ item by index
 */
export function removeFaq(index: number): ContentUpdater {
  return (prev: TemplateConfig) => ({
    ...prev,
    faq: (prev.faq || []).filter((_, i) => i !== index),
  });
}

/**
 * Update an FAQ field
 */
export function updateFaq(
  index: number,
  field: string,
  value: string
): ContentUpdater {
  return (prev: TemplateConfig) => ({
    ...prev,
    faq: (prev.faq || []).map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ),
  });
}

/**
 * Update about field
 */
export function updateAboutField(
  field: keyof NonNullable<TemplateConfig['about']>,
  value: string
): ContentUpdater {
  return (prev: TemplateConfig) => ({
    ...prev,
    about: {
      ...(prev.about || { name: '', bio: '' }),
      [field]: value,
    },
  });
}

/**
 * Update video URL
 */
export function updateVideoUrl(value: string): ContentUpdater {
  return (prev: TemplateConfig) => ({
    ...prev,
    videoUrl: value,
  });
}
