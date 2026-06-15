import { describe, expect, test } from "vitest";
import type { TemplateConfig } from "@/src/lib/templates";
import { updateSeoField } from "./sectionUpdaters";

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
