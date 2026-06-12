"use client";

import type { SiteId } from "@/src/lib/types";

type FooterBlockProps = {
  content: null;
  theme: { primaryColor: string; appearance?: "light" | "dark" };
  siteId: SiteId;
  isPreview?: boolean;
};

export default function FooterBlock({ theme }: FooterBlockProps) {
  const isDark = theme.appearance === "dark";

  return (
    <footer
      className={
        isDark
          ? "border-t border-[#232327] bg-transparent text-[#a1a1aa]"
          : "bg-gray-900 text-white"
      }
    >
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="text-center">
          <p
            className={`text-sm leading-5 ${
              isDark ? "text-[#71717a]" : "text-gray-400"
            }`}
          >
            &copy; {new Date().getFullYear()} Rascal Pages. Kaikki oikeudet
            pidätetään.
          </p>
        </div>
      </div>
    </footer>
  );
}
