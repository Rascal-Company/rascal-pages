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
  CasesContent,
  TechStackGroup,
  BlogContent,
  FormContent,
  ThemeConfig,
  BentoItem,
  BentoElementType,
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

function bentoItem(
  type: BentoElementType,
  x: number,
  y: number,
  w: number,
  h: number,
  extra: Partial<BentoItem> = {},
): BentoItem {
  return { id: createSectionId(nanoid()), type, x, y, w, h, ...extra };
}

type BentoWork = {
  title: string;
  summary: string;
  tags: string[];
  linkUrl?: string;
  linkLabel?: string;
};

/**
 * Lay the interview answers out as a curated 12-column bento grid: a hero band
 * (name + tagline, optional headline stat), the story, an expertise row of
 * cards, and a works showcase of cards. A fixed, designer-chosen layout keeps
 * every generated portfolio at a consistent 5/5 regardless of content length.
 */
export function buildPortfolioBento(
  answers: PortfolioInterviewAnswers,
): BentoItem[] {
  const items: BentoItem[] = [];
  let y = 0;

  const firstOutcome = answers.works?.[0]?.outcomes?.[0];
  const hasHeroStat = Boolean(firstOutcome && firstOutcome.value.trim() !== "");
  const nameWidth = hasHeroStat ? 8 : 12;

  // Hero band
  items.push(bentoItem("heading", 0, y, nameWidth, 2, { text: answers.name }));
  if (answers.tagline) {
    items.push(
      bentoItem("text", 0, y + 2, nameWidth, 1, { text: answers.tagline }),
    );
  }
  if (hasHeroStat && firstOutcome) {
    items.push(
      bentoItem("stat", 8, y, 4, 3, {
        value: firstOutcome.value,
        label: firstOutcome.label,
      }),
    );
  }
  y += 3;

  // Story
  items.push(bentoItem("text", 0, y, 12, 2, { text: answers.story }));
  y += 2;

  // Expertise cards
  const groups = mapSkillGroups(answers.skills);
  if (groups && groups.length > 0) {
    items.push(
      bentoItem("heading", 0, y, 12, 1, {
        text: answers.expertiseHeading ?? "Osaaminen",
      }),
    );
    y += 1;
    const shown = groups.slice(0, 6);
    shown.forEach((g, i) => {
      items.push(
        bentoItem("card", (i % 3) * 4, y + Math.floor(i / 3) * 2, 4, 2, {
          text: g.group,
          body: g.items.join(" · "),
        }),
      );
    });
    y += Math.ceil(shown.length / 3) * 2;
  }

  // Works showcase
  const casesDefault = getPortfolioDefault<"cases">("cases") as CasesContent;
  const works: BentoWork[] =
    answers.works && answers.works.length > 0
      ? answers.works.map((w) => ({
          title: w.title,
          summary: w.summary,
          tags: (w.tags ?? []).map((t) => t.trim()).filter((t) => t !== ""),
          linkUrl: w.linkUrl,
          linkLabel: w.linkLabel,
        }))
      : casesDefault.items.map((c) => ({
          title: c.title,
          summary: c.summary,
          tags: c.tags,
          linkUrl: c.linkUrl,
          linkLabel: c.linkLabel,
        }));

  items.push(
    bentoItem("heading", 0, y, 12, 1, {
      text: answers.worksHeading ?? "Työt",
    }),
  );
  y += 1;
  const shownWorks = works.slice(0, 6);
  shownWorks.forEach((w, i) => {
    items.push(
      bentoItem("card", (i % 2) * 6, y + Math.floor(i / 2) * 3, 6, 3, {
        text: w.title,
        body: w.summary,
        tags: w.tags,
        url: w.linkUrl || undefined,
        label: w.linkLabel || undefined,
      }),
    );
  });

  return items;
}

export function buildPortfolioConfig(
  answers: PortfolioInterviewAnswers,
): TemplateConfig {
  const blogDefault = getPortfolioDefault<"blog">("blog") as BlogContent;
  const formDefault = getPortfolioDefault<"form">("form") as FormContent;

  const theme: ThemeConfig = {
    primaryColor: answers.primaryColor ?? "#3b82f6",
    appearance: answers.appearance ?? "dark",
    headingFont: "Inter",
    bodyFont: "Inter",
  };

  const sections: Section[] = [
    newSection("bento", { items: buildPortfolioBento(answers) }),
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
