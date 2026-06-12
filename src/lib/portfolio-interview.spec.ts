import { describe, expect, test } from "vitest";
import {
  buildPortfolioConfig,
  buildPortfolioBento,
  suggestSubdomain,
  type PortfolioInterviewAnswers,
} from "./portfolio-interview";
import type { BentoContent, BentoItem } from "./templates";

const minimalAnswers: PortfolioInterviewAnswers = {
  name: "Aino Virtanen",
  story: "Olen valokuvaaja Helsingistä.",
};

function bentoItems(
  config: ReturnType<typeof buildPortfolioConfig>,
): BentoItem[] {
  const bento = config.sections.find((s) => s.type === "bento")?.content as
    | BentoContent
    | undefined;
  return bento?.items ?? [];
}

describe(buildPortfolioBento, () => {
  test("opens with the name as a heading and the tagline as text", () => {
    const items = buildPortfolioBento({
      ...minimalAnswers,
      tagline: "Häät ja muotokuvat",
    });
    expect(items[0]).toMatchObject({ type: "heading", text: "Aino Virtanen" });
    expect(
      items.some((i) => i.type === "text" && i.text === "Häät ja muotokuvat"),
    ).toBe(true);
  });

  test("places the story as a text element", () => {
    const items = buildPortfolioBento(minimalAnswers);
    expect(
      items.some(
        (i) => i.type === "text" && i.text === "Olen valokuvaaja Helsingistä.",
      ),
    ).toBe(true);
  });

  test("renders each skill group as a card with its items joined", () => {
    const items = buildPortfolioBento({
      ...minimalAnswers,
      skills: [{ group: "Kuvaus", items: ["Häät", "Muotokuvat"] }],
    });
    const card = items.find((i) => i.type === "card" && i.text === "Kuvaus");
    expect(card?.body).toBe("Häät · Muotokuvat");
  });

  test("renders each work as a card with title, summary and tags", () => {
    const items = buildPortfolioBento({
      ...minimalAnswers,
      works: [
        {
          title: "Hääkuvaus",
          summary: "Kokopäivän hääkuvaus.",
          tags: ["Häät", "  ", "Muotokuva"],
          linkUrl: "https://example.com",
        },
      ],
    });
    const card = items.find((i) => i.type === "card" && i.text === "Hääkuvaus");
    expect(card).toMatchObject({
      type: "card",
      text: "Hääkuvaus",
      body: "Kokopäivän hääkuvaus.",
      tags: ["Häät", "Muotokuva"],
      url: "https://example.com",
    });
  });

  test("promotes the first work outcome into a headline stat", () => {
    const items = buildPortfolioBento({
      ...minimalAnswers,
      works: [
        {
          title: "Hääkuvaus",
          summary: "Iso projekti.",
          outcomes: [{ value: "200", label: "Kuvaa" }],
        },
      ],
    });
    const stat = items.find((i) => i.type === "stat");
    expect(stat).toMatchObject({ value: "200", label: "Kuvaa" });
  });

  test("falls back to template default works when none are provided", () => {
    const items = buildPortfolioBento(minimalAnswers);
    expect(items.some((i) => i.type === "card")).toBe(true);
  });

  test("every item has a unique id and non-negative placement", () => {
    const items = buildPortfolioBento(minimalAnswers);
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(items.every((i) => i.x >= 0 && i.y >= 0 && i.w > 0 && i.h > 0)).toBe(
      true,
    );
  });
});

describe(buildPortfolioConfig, () => {
  test("fills the bento hero from the core answers", () => {
    const config = buildPortfolioConfig(minimalAnswers);
    expect(bentoItems(config)[0]).toMatchObject({
      type: "heading",
      text: "Aino Virtanen",
    });
  });

  test("uses the portfolio template id and dark appearance by default", () => {
    const config = buildPortfolioConfig(minimalAnswers);
    expect(config.templateId).toBe("portfolio");
    expect(config.theme.appearance).toBe("dark");
  });

  test("lays the portfolio out as a single bento plus blog, form and footer", () => {
    const config = buildPortfolioConfig(minimalAnswers);
    expect(config.sections.map((s) => s.type)).toEqual([
      "bento",
      "blog",
      "form",
      "footer",
    ]);
  });

  test("omits the blog section when includeBlog is false", () => {
    const config = buildPortfolioConfig({
      ...minimalAnswers,
      includeBlog: false,
    });
    expect(config.sections.map((s) => s.type)).toEqual([
      "bento",
      "form",
      "footer",
    ]);
  });

  test("honours an explicit appearance and primary color", () => {
    const config = buildPortfolioConfig({
      ...minimalAnswers,
      appearance: "light",
      primaryColor: "#e87b4e",
    });
    expect(config.theme.appearance).toBe("light");
    expect(config.theme.primaryColor).toBe("#e87b4e");
  });

  test("assigns a unique id to every section", () => {
    const config = buildPortfolioConfig(minimalAnswers);
    const ids = config.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe(suggestSubdomain, () => {
  test("strips spaces and transliterates Finnish characters", () => {
    expect(suggestSubdomain("Äiti Örn")).toBe("aitiorn");
  });

  test("removes punctuation and keeps alphanumerics", () => {
    expect(suggestSubdomain("Aino V. – 2026!")).toBe("ainov2026");
  });

  test("falls back to a default when nothing usable remains", () => {
    expect(suggestSubdomain("—#@!")).toBe("portfolio");
  });
});
