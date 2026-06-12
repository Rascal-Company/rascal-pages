"use client";

import type { TechStackContent } from "@/src/lib/templates";
import type { SiteId } from "@/src/lib/types";
import { surfaceTokens } from "./appearance";

type TechStackBlockProps = {
  content: TechStackContent;
  theme: { primaryColor: string; appearance?: "light" | "dark" };
  siteId: SiteId;
  isPreview?: boolean;
};

export default function TechStackBlock({
  content,
  theme,
}: TechStackBlockProps) {
  if (!content || content.groups.length === 0) return null;

  const t = surfaceTokens(theme);

  return (
    <section id="osaaminen" className={`py-24 sm:py-32 ${t.sectionAlt}`}>
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

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {content.groups.map((group, index) => (
            <div key={index} className={`rounded-2xl p-6 ${t.card}`}>
              <h3
                className={`text-sm font-semibold uppercase tracking-wide ${t.muted}`}
              >
                {group.group}
              </h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {group.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className={`rounded-full px-3 py-1 text-sm font-medium ${t.chip}`}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
