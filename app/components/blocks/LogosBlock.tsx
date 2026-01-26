"use client";

import type { SiteId } from "@/src/lib/types";

type LogosBlockProps = {
  content: null;
  theme: { primaryColor: string };
  siteId: SiteId;
  isPreview?: boolean;
};

export default function LogosBlock({}: LogosBlockProps) {
  return (
    <section className="py-12 bg-gray-50 border-y border-gray-200">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wide mb-8">
          Luottavat meihin
        </p>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex items-center justify-center h-12 text-gray-400 text-sm font-semibold"
            >
              Logo {i}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
