"use client";

import type { SiteId } from "@/src/lib/types";

type FooterBlockProps = {
  content: null;
  theme: { primaryColor: string };
  siteId: SiteId;
  isPreview?: boolean;
};

export default function FooterBlock({}: FooterBlockProps) {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="text-center">
          <p className="text-sm leading-5 text-gray-400">
            &copy; {new Date().getFullYear()} Rascal Pages. Kaikki oikeudet
            pidätetään.
          </p>
        </div>
      </div>
    </footer>
  );
}
