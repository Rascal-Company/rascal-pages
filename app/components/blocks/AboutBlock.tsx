"use client";

import type { ReactNode } from "react";
import type { AboutContent } from "@/src/lib/templates";
import type { SiteId } from "@/src/lib/types";
import EditableText from "./EditableText";

type AboutBlockProps = {
  content: AboutContent;
  theme: { primaryColor: string; appearance?: "light" | "dark" };
  siteId: SiteId;
  isPreview?: boolean;
  templateId?: string;
};

const DEFAULT_ABOUT_ORDER = ["name", "bio", "image"];

function renderAboutField(
  content: AboutContent,
  fieldKey: string,
  isDark: boolean,
  isPortfolio: boolean,
): ReactNode {
  switch (fieldKey) {
    case "name":
      return (
        <EditableText
          as="h2"
          field="name"
          value={content.name || "Tarina"}
          className={`text-3xl font-bold tracking-tight sm:text-4xl mb-6 ${
            isPortfolio ? "text-foreground" : "text-gray-900"
          }`}
          style={{ fontFamily: "var(--heading-font, inherit)" }}
        />
      );
    case "bio":
      return (
        <div
          className={`prose prose-lg max-w-none ${
            isDark ? "prose-invert" : "prose-gray"
          }`}
        >
          <EditableText
            as="p"
            field="bio"
            value={content.bio}
            className={`text-lg leading-8 whitespace-pre-line ${
              isPortfolio ? "text-muted-foreground" : "text-gray-600"
            }`}
            style={{ fontFamily: "var(--body-font, inherit)" }}
          />
        </div>
      );
    case "image":
      return content.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={content.image}
          alt={content.name}
          className={`mb-8 h-28 w-28 rounded-full object-cover ${
            isPortfolio ? "ring-1 ring-border" : ""
          }`}
        />
      ) : null;
    default:
      return null;
  }
}

export default function AboutBlock({
  content,
  theme,
  templateId,
}: AboutBlockProps) {
  if (!content) return null;

  const isDark = theme.appearance === "dark";
  const isPortfolio = isDark || templateId === "portfolio";
  const order = content.fieldOrder || DEFAULT_ABOUT_ORDER;

  return (
    <section id="tarina" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {order.map((fieldKey) => {
            const rendered = renderAboutField(
              content,
              fieldKey,
              isDark,
              isPortfolio,
            );
            return rendered ? <div key={fieldKey}>{rendered}</div> : null;
          })}
        </div>
      </div>
    </section>
  );
}
