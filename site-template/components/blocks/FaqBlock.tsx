import type { FaqItem } from "@/lib/templates";

export default function FaqBlock({ content }: { content: FaqItem[] }) {
  if (!content || content.length === 0) return null;

  return (
    <section className="bg-gray-50 py-24 sm:py-32">
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
                className="mb-3 text-lg font-semibold text-gray-900"
                style={{ fontFamily: "var(--heading-font, inherit)" }}
              >
                {item.question}
              </h3>
              <p
                className="leading-relaxed text-gray-600"
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
