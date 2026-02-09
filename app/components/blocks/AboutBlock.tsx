"use client";

import type { ReactNode } from "react";
import type { AboutContent } from "@/src/lib/templates";
import type { SiteId } from "@/src/lib/types";

type AboutBlockProps = {
  content: AboutContent;
  theme: { primaryColor: string };
  siteId: SiteId;
  isPreview?: boolean;
};

const DEFAULT_ABOUT_ORDER = ["name", "bio", "image"];

function renderAboutField(content: AboutContent, fieldKey: string): ReactNode {
  switch (fieldKey) {
    case "name":
      return (
        <h2
          className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-8"
          style={{ fontFamily: "var(--heading-font, inherit)" }}
        >
          {content.name || "Tarina"}
        </h2>
      );
    case "bio":
      return (
        <div className="prose prose-lg prose-gray max-w-none">
          <p
            className="text-lg leading-8 text-gray-600 whitespace-pre-line"
            style={{ fontFamily: "var(--body-font, inherit)" }}
          >
            {content.bio}
          </p>
        </div>
      );
    case "image":
      return content.image ? (
        <img
          src={content.image}
          alt={content.name}
          className="h-32 w-32 rounded-full object-cover"
        />
      ) : null;
    default:
      return null;
  }
}

export default function AboutBlock({ content }: AboutBlockProps) {
  if (!content) return null;

  const order = content.fieldOrder || DEFAULT_ABOUT_ORDER;

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {order.map((fieldKey) => {
            const rendered = renderAboutField(content, fieldKey);
            return rendered ? (
              <div key={fieldKey}>{rendered}</div>
            ) : null;
          })}
        </div>
      </div>
    </section>
  );
}
