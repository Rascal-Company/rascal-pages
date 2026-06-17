import { describe, expect, test } from "vitest";
import type { TemplateConfig } from "@/src/lib/templates";
import type { SectionId } from "@/src/lib/types";
import type { ThemePreset } from "@/src/lib/site-theme";
import {
  applyThemePreset,
  moveSection,
  updateSectionStyle,
  updateSeoField,
  updateThemeRadius,
} from "./sectionUpdaters";

const baseContent: TemplateConfig = {
  templateId: "saas-modern",
  theme: { primaryColor: "#3B82F6" },
  sections: [],
};

describe(updateSeoField, () => {
  test("sets the given SEO field without touching other fields", () => {
    const withDescription = updateSeoField(
      "metaDescription",
      "Hakukonekuvaus",
    )(baseContent);

    const result = updateSeoField("metaTitle", "Oma otsikko")(withDescription);

    expect(result.seo).toEqual({
      metaDescription: "Hakukonekuvaus",
      metaTitle: "Oma otsikko",
    });
  });

  test("clears the field to undefined when given an empty value", () => {
    const withValue = updateSeoField("metaTitle", "Oma otsikko")(baseContent);

    const result = updateSeoField("metaTitle", "")(withValue);

    expect(result.seo).toEqual({ metaTitle: undefined });
  });

  test("does not mutate the previous content", () => {
    updateSeoField("metaTitle", "Oma otsikko")(baseContent);

    expect(baseContent.seo).toBeUndefined();
  });
});

describe(applyThemePreset, () => {
  test("sets appearance, primary color and palette from the preset", () => {
    const preset: ThemePreset = {
      id: "midnight",
      name: "Tumma",
      appearance: "dark",
      primaryColor: "#6366F1",
    };

    const result = applyThemePreset(preset)(baseContent);

    expect(result.theme).toEqual({
      primaryColor: "#6366F1",
      appearance: "dark",
      palette: undefined,
    });
  });

  test("replaces a previously customized palette", () => {
    const customized: TemplateConfig = {
      ...baseContent,
      theme: { primaryColor: "#000000", palette: { background: "#123456" } },
    };
    const preset: ThemePreset = {
      id: "mono",
      name: "Mono",
      appearance: "light",
      primaryColor: "#111827",
      palette: { foreground: "#111827" },
    };

    expect(applyThemePreset(preset)(customized).theme.palette).toEqual({
      foreground: "#111827",
    });
  });
});

describe(moveSection, () => {
  const threeSections: TemplateConfig = {
    templateId: "saas-modern",
    theme: { primaryColor: "#3B82F6" },
    sections: [
      { id: "a" as SectionId, type: "hero", content: {} as never, isVisible: true },
      { id: "b" as SectionId, type: "features", content: {} as never, isVisible: true },
      { id: "c" as SectionId, type: "footer", content: {} as never, isVisible: true },
    ],
  };

  test("moves a section down by one position", () => {
    const order = moveSection("a" as SectionId, "down")(threeSections).sections.map(
      (s) => s.id,
    );
    expect(order).toEqual(["b", "a", "c"]);
  });

  test("moves a section up by one position", () => {
    const order = moveSection("c" as SectionId, "up")(threeSections).sections.map(
      (s) => s.id,
    );
    expect(order).toEqual(["a", "c", "b"]);
  });

  test("is a no-op at the boundary", () => {
    expect(moveSection("a" as SectionId, "up")(threeSections)).toBe(threeSections);
  });
});

describe(updateSectionStyle, () => {
  const oneSection: TemplateConfig = {
    templateId: "saas-modern",
    theme: { primaryColor: "#3B82F6" },
    sections: [
      { id: "a" as SectionId, type: "hero", content: {} as never, isVisible: true },
    ],
  };

  test("merges a style patch into the target section", () => {
    const withBg = updateSectionStyle("a" as SectionId, {
      background: "#000000",
    })(oneSection);
    const result = updateSectionStyle("a" as SectionId, { paddingY: "lg" })(
      withBg,
    );

    expect(result.sections[0].style).toEqual({
      background: "#000000",
      paddingY: "lg",
    });
  });

  test("does not mutate the previous content", () => {
    updateSectionStyle("a" as SectionId, { align: "center" })(oneSection);
    expect(oneSection.sections[0].style).toBeUndefined();
  });
});

describe(updateThemeRadius, () => {
  test("sets the radius and clears it when empty", () => {
    const withRadius = updateThemeRadius("0.75rem")(baseContent);
    expect(withRadius.theme.radius).toBe("0.75rem");

    expect(updateThemeRadius("")(withRadius).theme.radius).toBeUndefined();
  });
});
