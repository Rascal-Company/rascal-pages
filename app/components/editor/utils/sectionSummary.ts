import type {
  AboutContent,
  BlogContent,
  CasesContent,
  CtaContent,
  FaqItem,
  FeatureItem,
  FormContent,
  GalleryContent,
  HeroContent,
  PricingContent,
  Section,
  TechStackContent,
  TestimonialItem,
  VideoContent,
} from "@/src/lib/templates";

const MAX_LENGTH = 48;

function truncate(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= MAX_LENGTH) return clean;
  return `${clean.slice(0, MAX_LENGTH - 1).trimEnd()}…`;
}

function firstNonBlank(...values: (string | undefined | null)[]): string {
  return values.find((value) => value && value.trim()) ?? "";
}

function firstItemText<T>(items: T[] | undefined, pick: (item: T) => string) {
  if (!items || items.length === 0) return "";
  const count = items.length;
  const first = pick(items[0]).trim();
  if (!first) return `${count} kpl`;
  return count > 1 ? `${first} +${count - 1}` : first;
}

/**
 * One-line description of what a section contains, for the section list.
 * Lets authors tell two sections of the same type apart ("Ominaisuudet ·
 * Nopea toimitus +3") instead of seeing only the type label. Empty string when
 * the section has nothing summarisable.
 */
export function summarizeSection(section: Section): string {
  const content = section.content as unknown;
  switch (section.type) {
    case "hero": {
      const c = content as HeroContent;
      return truncate(firstNonBlank(c?.title, c?.subtitle));
    }
    case "about": {
      const c = content as AboutContent;
      return truncate(firstNonBlank(c?.name, c?.bio));
    }
    case "features":
      return truncate(
        firstItemText(content as FeatureItem[], (item) => item.title ?? ""),
      );
    case "faq":
      return truncate(
        firstItemText(content as FaqItem[], (item) => item.question ?? ""),
      );
    case "testimonials":
      return truncate(
        firstItemText(content as TestimonialItem[], (item) => item.name ?? ""),
      );
    case "form": {
      const c = content as FormContent;
      const fields = c?.fields?.length ?? 0;
      return truncate(
        firstNonBlank(c?.formTitle, fields > 0 ? `${fields} kenttää` : ""),
      );
    }
    case "video": {
      const c = content as VideoContent;
      return truncate(c?.url ?? "");
    }
    case "blog":
    case "cases":
    case "techStack":
    case "pricing":
    case "gallery":
    case "cta": {
      const c = content as
        | BlogContent
        | CasesContent
        | TechStackContent
        | PricingContent
        | GalleryContent
        | CtaContent;
      return truncate(c?.heading ?? "");
    }
    default:
      return "";
  }
}
