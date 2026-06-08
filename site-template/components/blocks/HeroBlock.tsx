import type { HeroContent, ThemeConfig } from "@/lib/templates";

/**
 * Hero section. Ported from the app and simplified for the static site: the
 * lead-capture form and analytics links are intentionally dropped (those route
 * through the central service, wired up in a later scope). The CTA is a plain
 * anchor.
 */
export default function HeroBlock({
  content,
  theme,
}: {
  content: HeroContent;
  theme: ThemeConfig;
}) {
  const primaryColor = theme.primaryColor || "#0EA5E9";

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{
        backgroundImage: content.image
          ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${content.image})`
          : `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1
            className="text-4xl font-bold tracking-tight sm:text-6xl"
            style={{ fontFamily: "var(--heading-font, inherit)" }}
          >
            {content.title}
          </h1>
          <p
            className="mt-6 text-lg leading-8 text-white/90"
            style={{ fontFamily: "var(--body-font, inherit)" }}
          >
            {content.subtitle}
          </p>
          {content.ctaText && (
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href={content.ctaLink}
                className="rounded-md bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-100"
              >
                {content.ctaText}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
