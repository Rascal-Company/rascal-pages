import type { ReactNode } from "react";
import type { FeatureItem } from "@/lib/templates";

const DEFAULT_FEATURE_ORDER = ["icon", "image", "title", "description"];

function renderFeatureField(feature: FeatureItem, fieldKey: string): ReactNode {
  switch (fieldKey) {
    case "icon":
      if (feature.image) return null;
      return feature.icon ? (
        <div className="mb-4 text-5xl">{feature.icon}</div>
      ) : null;
    case "image":
      return feature.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={feature.image}
          alt={feature.title}
          className="mb-4 h-16 w-16 rounded-xl object-cover"
        />
      ) : null;
    case "title":
      return (
        <h3
          className="mb-2 text-xl font-semibold text-gray-900"
          style={{ fontFamily: "var(--heading-font, inherit)" }}
        >
          {feature.title}
        </h3>
      );
    case "description":
      return (
        <p
          className="leading-relaxed text-gray-600"
          style={{ fontFamily: "var(--body-font, inherit)" }}
        >
          {feature.description}
        </p>
      );
    default:
      return null;
  }
}

export default function FeaturesBlock({ content }: { content: FeatureItem[] }) {
  if (!content || content.length === 0) return null;

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            style={{ fontFamily: "var(--heading-font, inherit)" }}
          >
            Ominaisuudet
          </h2>
          <p
            className="mt-2 text-lg leading-8 text-gray-600"
            style={{ fontFamily: "var(--body-font, inherit)" }}
          >
            Tutustu tarjoamiimme ratkaisuihin
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {content.map((feature, index) => {
            const order = feature.fieldOrder || DEFAULT_FEATURE_ORDER;
            return (
              <div
                key={index}
                className="flex flex-col items-start rounded-2xl bg-gray-50 p-8 shadow-sm transition-shadow hover:shadow-md"
              >
                {order.map((fieldKey) => {
                  const rendered = renderFeatureField(feature, fieldKey);
                  return rendered ? <div key={fieldKey}>{rendered}</div> : null;
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
