import { describe, expect, test } from "vitest";
import {
  parseTagList,
  formatTagList,
  getTemplateById,
  ADDABLE_SECTION_TYPES,
  SECTION_TYPE_LABELS,
  type SectionType,
} from "./templates";

describe(parseTagList, () => {
  test("splits a comma-separated string into trimmed tags", () => {
    expect(parseTagList("React, Supabase, TypeScript")).toEqual([
      "React",
      "Supabase",
      "TypeScript",
    ]);
  });

  test("drops blank entries and surrounding whitespace", () => {
    expect(parseTagList("React, ,  , Node,")).toEqual(["React", "Node"]);
  });

  test("de-duplicates while preserving first-seen order", () => {
    expect(parseTagList("React, Node, React")).toEqual(["React", "Node"]);
  });

  test("returns an empty list for an empty string", () => {
    expect(parseTagList("")).toEqual([]);
  });
});

describe(formatTagList, () => {
  test("joins tags back into comma-separated form", () => {
    expect(formatTagList(["React", "Supabase"])).toBe("React, Supabase");
  });

  test("round-trips with parseTagList", () => {
    const tags = ["React", "Node", "PostgreSQL"];
    expect(parseTagList(formatTagList(tags))).toEqual(tags);
  });
});

describe("portfolio template", () => {
  test("is registered with the expected section order", () => {
    const portfolio = getTemplateById("portfolio");
    const types = portfolio?.defaultContent.sections.map((s) => s.type);
    expect(types).toEqual([
      "hero",
      "about",
      "techStack",
      "cases",
      "blog",
      "form",
      "footer",
    ]);
  });

  test("opts into the dark appearance", () => {
    const portfolio = getTemplateById("portfolio");
    expect(portfolio?.defaultContent.theme.appearance).toBe("dark");
  });
});

describe("section type registration", () => {
  test("every addable section type has a display label", () => {
    const missing = ADDABLE_SECTION_TYPES.filter(
      (type: SectionType) => !SECTION_TYPE_LABELS[type],
    );
    expect(missing).toEqual([]);
  });

  test("includes the new cases and techStack sections", () => {
    expect(ADDABLE_SECTION_TYPES).toContain("cases");
    expect(ADDABLE_SECTION_TYPES).toContain("techStack");
  });
});
