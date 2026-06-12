"use client";

import type { ReactNode } from "react";
import type { AboutContent } from "@/src/lib/templates";
import type { SiteId } from "@/src/lib/types";

type AboutBlockProps = {
  content: AboutContent;
  theme: { primaryColor: string; appearance?: "light" | "dark" };
  siteId: SiteId;
  isPreview?: boolean;
};

const DEFAULT_ABOUT_ORDER = ["name", "bio", "image"];

function renderAboutField(
  content: AboutContent,
  fieldKey: string,
  isDark: boolean,
): ReactNode {
  switch (fieldKey) {
    case "name":
      return (
        <h2
          className={`text-3xl font-bold tracking-tight sm:text-4xl mb-6 ${
            isDark ? "text-[#f5f5f7]" : "text-gray-900"
          }`}
          style={{ fontFamily: "var(--heading-font, inherit)" }}
        >
          {content.name || "Tarina"}
        </h2>
      );
    case "bio":
      return (
        <div
          className={`prose prose-lg max-w-none ${
            isDark ? "prose-invert" : "prose-gray"
          }`}
        >
          <p
            className={`text-lg leading-8 whitespace-pre-line ${
              isDark ? "text-[#a1a1aa]" : "text-gray-600"
            }`}
            style={{ fontFamily: "var(--body-font, inherit)" }}
          >
            {content.bio}
          </p>
        </div>
      );
    case "image":
      return content.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={content.image}
          alt={content.name}
          className={`mb-8 h-28 w-28 rounded-full object-cover ${
            isDark ? "ring-1 ring-[#232327]" : ""
          }`}
        />
      ) : null;
    default:
      return null;
  }
}

export default function AboutBlock({ content, theme }: AboutBlockProps) {
  if (!content) return null;

  const isDark = theme.appearance === "dark";
  const order = content.fieldOrder || DEFAULT_ABOUT_ORDER;

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {order.map((fieldKey) => {
            const rendered = renderAboutField(content, fieldKey, isDark);
            return rendered ? <div key={fieldKey}>{rendered}</div> : null;
          })}
        </div>
      </div>
    </section>
  );
}
