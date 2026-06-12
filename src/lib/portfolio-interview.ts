/**
 * Maps structured portfolio-interview answers (collected by the ElevenLabs
 * voice agent and forwarded via n8n) into a portfolio `TemplateConfig`.
 *
 * This is the single source of truth for the interview → site mapping: the
 * portfolio template's structure and default copy live in `templates.ts`, and
 * this module fills it with the user's answers. Keeping it pure makes it
 * trivially testable and lets the n8n endpoint stay a thin wrapper.
 */

import { nanoid } from "nanoid";
import type {
  TemplateConfig,
  Section,
  SectionType,
  SectionContentMap,
  HeroContent,
  AboutContent,
  CasesContent,
  CaseItem,
  CaseOutcome,
  TechStackContent,
  TechStackGroup,
  BlogContent,
  FormContent,
  ThemeConfig,
} from "./templates";
import { getTemplateById } from "./templates";
import { createSectionId } from "./types";

export type InterviewOutcome = {
  value: string;
  label: string;
};

export type InterviewWork = {
  title: string;
  tagline?: string;
  summary: string;
  tags?: string[];
  outcomes?: InterviewOutcome[];
  linkLabel?: string;
  linkUrl?: string;
};

export type InterviewSkillGroup = {
  group: string;
  items: string[];
};

/**
 * Profession-agnostic answers gathered during the interview. Only `name` and
 * `story` are required; everything else falls back to the template defaults.
 */
export type PortfolioInterviewAnswers = {
  name: string;
  tagline?: string;
  story: string;
  /** Heading for the expertise section, e.g. "Palvelut" / "Teknologiat". */
  expertiseHeading?: string;
  skills?: InterviewSkillGroup[];
  worksHeading?: string;
  works?: InterviewWork[];
  /** Whether to include the blog section. Defaults to true. */
  includeBlog?: boolean;
  primaryColor?: string;
  appearance?: "light" | "dark";
};

function newSection<T extends SectionType>(
  type: T,
  content: SectionContentMap[T],
): Section<T> {
  return {
    id: createSectionId(nanoid()),
    type,
    content,
    isVisible: true,
  };
}

function getPortfolioDefault<T extends SectionType>(
  type: T,
): SectionContentMap[T] {
  const template = getTemplateById("portfolio");
  const section = template?.defaultContent.sections.find(
    (s) => s.type === type,
  );
  if (!section) {
    throw new Error(`Portfolio template is missing a "${type}" section`);
  }
  return section.content as SectionContentMap[T];
}

function mapOutcomes(outcomes: InterviewOutcome[] | undefined): CaseOutcome[] {
  if (!outcomes) return [];
  return outcomes
    .filter((o) => o.value.trim() !== "" || o.label.trim() !== "")
    .map((o) => ({ value: o.value, label: o.label }));
}

function mapWork(work: InterviewWork): CaseItem {
  return {
    title: work.title,
    tagline: work.tagline ?? "",
    summary: work.summary,
    image: "",
    tags: (work.tags ?? []).map((t) => t.trim()).filter((t) => t !== ""),
    outcomes: mapOutcomes(work.outcomes),
    linkLabel: work.linkLabel ?? "",
    linkUrl: work.linkUrl ?? "",
  };
}

function mapSkillGroups(
  groups: InterviewSkillGroup[] | undefined,
): TechStackGroup[] | null {
  if (!groups || groups.length === 0) return null;
  const cleaned = groups
    .map((g) => ({
      group: g.group,
      items: (g.items ?? []).map((i) => i.trim()).filter((i) => i !== ""),
    }))
    .filter((g) => g.group.trim() !== "" && g.items.length > 0);
  return cleaned.length > 0 ? cleaned : null;
}

export function buildPortfolioConfig(
  answers: PortfolioInterviewAnswers,
): TemplateConfig {
  const heroDefault = getPortfolioDefault<"hero">("hero") as HeroContent;
  const aboutDefault = getPortfolioDefault<"about">("about") as AboutContent;
  const techStackDefault = getPortfolioDefault<"techStack">(
    "techStack",
  ) as TechStackContent;
  const casesDefault = getPortfolioDefault<"cases">("cases") as CasesContent;
  const blogDefault = getPortfolioDefault<"blog">("blog") as BlogContent;
  const formDefault = getPortfolioDefault<"form">("form") as FormContent;

  const hero: HeroContent = {
    ...heroDefault,
    title: answers.name,
    subtitle: answers.tagline ?? heroDefault.subtitle,
  };

  const about: AboutContent = {
    ...aboutDefault,
    bio: answers.story,
  };

  const skillGroups = mapSkillGroups(answers.skills);
  const techStack: TechStackContent = {
    ...techStackDefault,
    heading: answers.expertiseHeading ?? techStackDefault.heading,
    groups: skillGroups ?? techStackDefault.groups,
  };

  const works =
    answers.works && answers.works.length > 0
      ? answers.works.map(mapWork)
      : casesDefault.items;
  const cases: CasesContent = {
    ...casesDefault,
    heading: answers.worksHeading ?? casesDefault.heading,
    items: works,
  };

  const theme: ThemeConfig = {
    primaryColor: answers.primaryColor ?? "#3b82f6",
    appearance: answers.appearance ?? "dark",
    headingFont: "Inter",
    bodyFont: "Inter",
  };

  const sections: Section[] = [
    newSection("hero", hero),
    newSection("about", about),
    newSection("techStack", techStack),
    newSection("cases", cases),
  ];

  if (answers.includeBlog !== false) {
    sections.push(newSection("blog", { ...blogDefault } satisfies BlogContent));
  }

  sections.push(newSection("form", { ...formDefault }));
  sections.push(newSection("footer", null));

  return {
    templateId: "portfolio",
    theme,
    sections,
  };
}

/**
 * Derive a unique-ish, alphanumeric subdomain candidate from a display name.
 * Subdomains may only contain letters and numbers, so this strips everything
 * else and transliterates common Finnish characters. Callers must still check
 * availability and append a suffix on collision.
 */
export function suggestSubdomain(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[äå]/g, "a")
    .replace(/ö/g, "o")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
  return base || "portfolio";
}
