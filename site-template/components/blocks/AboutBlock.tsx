import type { AboutContent } from "@/lib/templates";

/**
 * About / "what I'm doing now" section. Ported from the app as a presentational
 * server component.
 */
export default function AboutBlock({ content }: { content: AboutContent }) {
  if (!content) return null;

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2
            className="mb-8 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            style={{ fontFamily: "var(--heading-font, inherit)" }}
          >
            {content.name || "Tarina"}
          </h2>
          <p
            className="text-lg leading-8 whitespace-pre-line text-gray-600"
            style={{ fontFamily: "var(--body-font, inherit)" }}
          >
            {content.bio}
          </p>
        </div>
      </div>
    </section>
  );
}
