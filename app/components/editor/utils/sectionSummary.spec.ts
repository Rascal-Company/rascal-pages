import { describe, expect, test } from "vitest";
import { summarizeSection } from "./sectionSummary";
import { createSection } from "./contentUtils";
import type { Section } from "@/src/lib/templates";

function section<T extends Section["type"]>(
  type: T,
  content: unknown,
): Section {
  return { ...createSection(type), content } as Section;
}

describe("summarizeSection", () => {
  test("hero uses the title", () => {
    expect(
      summarizeSection(
        section("hero", { title: "Rakennamme kestävää", subtitle: "x" }),
      ),
    ).toBe("Rakennamme kestävää");
  });

  test("hero falls back to the subtitle when the title is blank", () => {
    expect(
      summarizeSection(
        section("hero", { title: "  ", subtitle: "Luotettava kumppani" }),
      ),
    ).toBe("Luotettava kumppani");
  });

  test("list sections show the first item and the remaining count", () => {
    const features = [
      { icon: "a", title: "Nopea toimitus", description: "" },
      { icon: "b", title: "Takuu", description: "" },
      { icon: "c", title: "Tuki", description: "" },
    ];
    expect(summarizeSection(section("features", features))).toBe(
      "Nopea toimitus +2",
    );
  });

  test("a single list item has no count suffix", () => {
    const faq = [{ question: "Mitä maksaa?", answer: "" }];
    expect(summarizeSection(section("faq", faq))).toBe("Mitä maksaa?");
  });

  test("list items without text fall back to the item count", () => {
    const faq = [
      { question: "", answer: "" },
      { question: "", answer: "" },
    ];
    expect(summarizeSection(section("faq", faq))).toBe("2 kpl");
  });

  test("form prefers the title over the field count", () => {
    const form = {
      fields: [{ id: "f1", type: "email", label: "Email", required: true }],
      formTitle: "Pyydä tarjous",
      successMessage: { title: "", description: "" },
    };
    expect(summarizeSection(section("form", form))).toBe("Pyydä tarjous");
  });

  test("form without a title shows the field count", () => {
    const form = {
      fields: [
        { id: "f1", type: "email", label: "Email", required: true },
        { id: "f2", type: "text", label: "Nimi", required: false },
      ],
      successMessage: { title: "", description: "" },
    };
    expect(summarizeSection(section("form", form))).toBe("2 kenttää");
  });

  test("heading sections use the heading", () => {
    expect(
      summarizeSection(section("cta", { heading: "Ota yhteyttä", text: "" })),
    ).toBe("Ota yhteyttä");
  });

  test("long text is truncated to 48 characters with an ellipsis", () => {
    const title = "A".repeat(60);
    const summary = summarizeSection(section("hero", { title, subtitle: "" }));
    expect(summary).toBe(`${"A".repeat(47)}…`);
  });

  test("sections without summarisable content return an empty string", () => {
    expect(summarizeSection(section("logos", null))).toBe("");
    expect(summarizeSection(section("footer", null))).toBe("");
  });

  test("survives malformed content", () => {
    expect(summarizeSection(section("features", undefined))).toBe("");
    expect(summarizeSection(section("hero", null))).toBe("");
  });
});
