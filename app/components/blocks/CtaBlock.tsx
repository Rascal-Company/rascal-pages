"use client";

import type { CtaContent } from "@/src/lib/templates";
import type { SiteId } from "@/src/lib/types";
import { surfaceTokens } from "./appearance";
import EditableText from "./EditableText";

type CtaBlockProps = {
  content: CtaContent;
  theme: { primaryColor: string; appearance?: "light" | "dark" };
  siteId: SiteId;
  isPreview?: boolean;
  templateId?: string;
};

export default function CtaBlock({ content, theme }: CtaBlockProps) {
  if (!content) return null;

  const primaryColor = theme.primaryColor || "#3B82F6";
  const filled = content.filled ?? false;
  const t = surfaceTokens();

  const headingClass = filled
    ? "text-3xl font-bold tracking-tight text-white sm:text-4xl"
    : `text-3xl font-bold tracking-tight sm:text-4xl ${t.heading}`;
  const textClass = filled
    ? "mt-4 text-lg leading-8 text-white/90"
    : `mt-4 text-lg leading-8 ${t.body}`;

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div
          className={`mx-auto max-w-4xl rounded-3xl px-8 py-16 text-center sm:px-16 ${
            filled ? "" : t.card
          }`}
          style={filled ? { backgroundColor: primaryColor } : undefined}
        >
          <EditableText
            as="h2"
            field="heading"
            value={content.heading}
            className={headingClass}
            style={{ fontFamily: "var(--heading-font, inherit)" }}
          />
          {content.text && (
            <EditableText
              as="p"
              field="text"
              value={content.text}
              className={textClass}
              style={{ fontFamily: "var(--body-font, inherit)" }}
            />
          )}

          {(content.primaryCtaText || content.secondaryCtaText) && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {content.primaryCtaText && (
                <a
                  href={content.primaryCtaLink || "#"}
                  className="rounded-lg px-6 py-3 text-sm font-semibold shadow-sm transition-transform hover:-translate-y-0.5"
                  style={
                    filled
                      ? { backgroundColor: "#ffffff", color: primaryColor }
                      : { backgroundColor: primaryColor, color: "#ffffff" }
                  }
                >
                  {content.primaryCtaText}
                </a>
              )}
              {content.secondaryCtaText && (
                <a
                  href={content.secondaryCtaLink || "#"}
                  className={`text-sm font-semibold transition-opacity hover:opacity-80 ${
                    filled ? "text-white" : t.heading
                  }`}
                  style={filled ? undefined : { color: primaryColor }}
                >
                  {content.secondaryCtaText} →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
