"use client";

import type { AboutContent } from "@/src/lib/templates";
import type { SiteId } from "@/src/lib/types";

type AboutBlockProps = {
  content: AboutContent;
  theme: { primaryColor: string };
  siteId: SiteId;
  isPreview?: boolean;
};

export default function AboutBlock({ content }: AboutBlockProps) {
  if (!content) return null;

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-8">
            {content.name || "Tarina"}
          </h2>
          <div className="prose prose-lg prose-gray max-w-none">
            <p className="text-lg leading-8 text-gray-600 whitespace-pre-line">
              {content.bio}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
