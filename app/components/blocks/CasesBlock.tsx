"use client";

import type { CasesContent } from "@/src/lib/templates";
import type { SiteId } from "@/src/lib/types";
import { surfaceTokens } from "./appearance";

type CasesBlockProps = {
  content: CasesContent;
  theme: { primaryColor: string; appearance?: "light" | "dark" };
  siteId: SiteId;
  isPreview?: boolean;
};

export default function CasesBlock({ content, theme }: CasesBlockProps) {
  if (!content || content.items.length === 0) return null;

  const primaryColor = theme.primaryColor || "#3B82F6";
  const t = surfaceTokens(theme);

  return (
    <section id="projektit" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className={`text-3xl font-bold tracking-tight sm:text-4xl ${t.heading}`}
            style={{ fontFamily: "var(--heading-font, inherit)" }}
          >
            {content.heading}
          </h2>
          {content.subheading && (
            <p
              className={`mt-4 text-lg leading-8 ${t.body}`}
              style={{ fontFamily: "var(--body-font, inherit)" }}
            >
              {content.subheading}
            </p>
          )}
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:max-w-none lg:grid-cols-2">
          {content.items.map((item, index) => (
            <article
              key={index}
              className={`flex flex-col overflow-hidden rounded-2xl shadow-sm transition-transform duration-200 hover:-translate-y-1 ${t.card}`}
            >
              {item.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-52 w-full object-cover"
                />
              )}
              <div className="flex flex-1 flex-col p-8">
                <h3
                  className={`text-2xl font-semibold ${t.heading}`}
                  style={{ fontFamily: "var(--heading-font, inherit)" }}
                >
                  {item.title}
                </h3>
                {item.tagline && (
                  <p
                    className="mt-1 text-sm font-medium"
                    style={{ color: primaryColor }}
                  >
                    {item.tagline}
                  </p>
                )}
                <p
                  className={`mt-4 flex-1 leading-relaxed ${t.body}`}
                  style={{ fontFamily: "var(--body-font, inherit)" }}
                >
                  {item.summary}
                </p>

                {item.outcomes.length > 0 && (
                  <dl
                    className={`mt-6 grid grid-cols-2 gap-4 border-t pt-6 sm:grid-cols-3 ${t.divider}`}
                  >
                    {item.outcomes.map((outcome, outcomeIndex) => (
                      <div key={outcomeIndex}>
                        <dt
                          className={`text-xl font-bold ${t.heading}`}
                          style={{ fontFamily: "var(--heading-font, inherit)" }}
                        >
                          {outcome.value}
                        </dt>
                        <dd className={`mt-1 text-sm ${t.muted}`}>
                          {outcome.label}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}

                {item.tags.length > 0 && (
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {item.tags.map((tag, tagIndex) => (
                      <li
                        key={tagIndex}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${t.chip}`}
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}

                {item.linkUrl && (
                  <a
                    href={item.linkUrl}
                    className="mt-6 text-sm font-semibold hover:underline"
                    style={{ color: primaryColor }}
                  >
                    {item.linkLabel || "Lue lisää"} →
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
