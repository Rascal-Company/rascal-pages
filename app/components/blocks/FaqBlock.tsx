"use client";

import type { FaqItem } from "@/src/lib/templates";
import type { SiteId } from "@/src/lib/types";

type FaqBlockProps = {
  content: FaqItem[];
  theme: { primaryColor: string };
  siteId: SiteId;
  isPreview?: boolean;
};

export default function FaqBlock({ content }: FaqBlockProps) {
  if (!content || content.length === 0) return null;

  return (
    <section className="py-24 sm:py-32 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            style={{ fontFamily: "var(--heading-font, inherit)" }}
          >
            Usein kysytyt kysymykset
          </h2>
          <p
            className="mt-2 text-lg leading-8 text-gray-600"
            style={{ fontFamily: "var(--body-font, inherit)" }}
          >
            Löydä vastauksia yleisimpiin kysymyksiin
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl space-y-8">
          {content.map((item, index) => (
            <div key={index} className="rounded-2xl bg-white p-8 shadow-sm">
              <h3
                className="text-lg font-semibold text-gray-900 mb-3"
                style={{ fontFamily: "var(--heading-font, inherit)" }}
              >
                {item.question}
              </h3>
              <p
                className="text-gray-600 leading-relaxed"
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
