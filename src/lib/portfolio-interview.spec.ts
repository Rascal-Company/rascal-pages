import { describe, expect, test } from "vitest";
import {
  buildPortfolioConfig,
  suggestSubdomain,
  type PortfolioInterviewAnswers,
} from "./portfolio-interview";
import type {
  HeroContent,
  AboutContent,
  TechStackContent,
  CasesContent,
} from "./templates";

const minimalAnswers: PortfolioInterviewAnswers = {
  name: "Aino Virtanen",
  story: "Olen valokuvaaja Helsingistä.",
};

function sectionContent<T>(
  config: ReturnType<typeof buildPortfolioConfig>,
  type: string,
): T | undefined {
  return config.sections.find((s) => s.type === type)?.content as T | undefined;
}

describe(buildPortfolioConfig, () => {
  test("fills hero and about from the core answers", () => {
    const config = buildPortfolioConfig(minimalAnswers);
    const hero = sectionContent<HeroContent>(config, "hero");
    const about = sectionContent<AboutContent>(config, "about");
    expect(hero?.title).toBe("Aino Virtanen");
    expect(about?.bio).toBe("Olen valokuvaaja Helsingistä.");
  });

  test("uses the portfolio template id and dark appearance by default", () => {
    const config = buildPortfolioConfig(minimalAnswers);
    expect(config.templateId).toBe("portfolio");
    expect(config.theme.appearance).toBe("dark");
  });

  test("produces the full section order including blog by default", () => {
    const config = buildPortfolioConfig(minimalAnswers);
    expect(config.sections.map((s) => s.type)).toEqual([
      "hero",
      "about",
      "techStack",
      "cases",
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
      "hero",
      "about",
      "techStack",
      "cases",
      "form",
      "footer",
    ]);
  });

  test("applies a profession-specific expertise heading and skills", () => {
    const config = buildPortfolioConfig({
      ...minimalAnswers,
      expertiseHeading: "Palvelut",
      skills: [{ group: "Kuvaus", items: ["Häät", "Muotokuvat"] }],
    });
    const techStack = sectionContent<TechStackContent>(config, "techStack");
    expect(techStack).toEqual({
      heading: "Palvelut",
      subheading: "Mitä teen ja missä olen vahvimmillani.",
      groups: [{ group: "Kuvaus", items: ["Häät", "Muotokuvat"] }],
    });
  });

  test("maps works into case items, trimming empty tags and outcomes", () => {
    const config = buildPortfolioConfig({
      ...minimalAnswers,
      works: [
        {
          title: "Hääkuvaus",
          summary: "Kokopäivän hääkuvaus parille.",
          tags: ["Häät", "  ", "Muotokuva"],
          outcomes: [
            { value: "200", label: "Kuvaa" },
            { value: "", label: "" },
          ],
          linkUrl: "https://example.com",
        },
      ],
    });
    const cases = sectionContent<CasesContent>(config, "cases");
    expect(cases?.items).toEqual([
      {
        title: "Hääkuvaus",
        tagline: "",
        summary: "Kokopäivän hääkuvaus parille.",
        image: "",
        tags: ["Häät", "Muotokuva"],
        outcomes: [{ value: "200", label: "Kuvaa" }],
        linkLabel: "",
        linkUrl: "https://example.com",
      },
    ]);
  });

  test("falls back to template default works when none are provided", () => {
    const config = buildPortfolioConfig(minimalAnswers);
    const cases = sectionContent<CasesContent>(config, "cases");
    expect(cases?.items.length).toBeGreaterThan(0);
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
