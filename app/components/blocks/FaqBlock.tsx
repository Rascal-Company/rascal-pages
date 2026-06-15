"use client";

import type { FaqItem } from "@/src/lib/templates";
import type { SiteId } from "@/src/lib/types";
import { surfaceTokens } from "./appearance";

type FaqBlockProps = {
  content: FaqItem[];
  theme: { primaryColor: string; appearance?: "light" | "dark" };
  siteId: SiteId;
  isPreview?: boolean;
};

export default function FaqBlock({ content }: FaqBlockProps) {
  if (!content || content.length === 0) return null;

  const t = surfaceTokens();

  return (
    <section className={`py-24 sm:py-32 ${t.sectionAlt}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className={`text-3xl font-bold tracking-tight sm:text-4xl ${t.heading}`}
            style={{ fontFamily: "var(--heading-font, inherit)" }}
          >
            Usein kysytyt kysymykset
          </h2>
          <p
            className={`mt-2 text-lg leading-8 ${t.body}`}
            style={{ fontFamily: "var(--body-font, inherit)" }}
          >
            Löydä vastauksia yleisimpiin kysymyksiin
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl space-y-8">
          {content.map((item, index) => (
            <div key={index} className={`rounded-2xl p-8 shadow-sm ${t.card}`}>
              <h3
                className={`text-lg font-semibold mb-3 ${t.heading}`}
                style={{ fontFamily: "var(--heading-font, inherit)" }}
              >
                {item.question}
              </h3>
              <p
                className={`leading-relaxed ${t.body}`}
                style={{ fontFamily: "var(--body-font, inherit)" }}
              >
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
