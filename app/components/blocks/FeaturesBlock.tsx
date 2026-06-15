"use client";

import type { ReactNode } from "react";
import type { FeatureItem } from "@/src/lib/templates";
import type { SiteId } from "@/src/lib/types";
import { surfaceTokens, type SurfaceTokens } from "./appearance";

type FeaturesBlockProps = {
  content: FeatureItem[];
  theme: { primaryColor: string; appearance?: "light" | "dark" };
  siteId: SiteId;
  isPreview?: boolean;
};

const DEFAULT_FEATURE_ORDER = ["icon", "image", "title", "description"];

function renderFeatureField(
  feature: FeatureItem,
  fieldKey: string,
  t: SurfaceTokens,
): ReactNode {
  switch (fieldKey) {
    case "icon":
      if (feature.image) return null;
      return feature.icon ? (
        <div className="text-5xl mb-4">{feature.icon}</div>
      ) : null;
    case "image":
      return feature.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={feature.image}
          alt={feature.title}
          className="h-16 w-16 rounded-xl object-cover mb-4"
        />
      ) : null;
    case "title":
      return (
        <h3
          className={`text-xl font-semibold mb-2 ${t.heading}`}
          style={{ fontFamily: "var(--heading-font, inherit)" }}
        >
          {feature.title}
        </h3>
      );
    case "description":
      return (
        <p
          className={`leading-relaxed ${t.body}`}
          style={{ fontFamily: "var(--body-font, inherit)" }}
        >
          {feature.description}
        </p>
      );
    default:
      return null;
  }
}

export default function FeaturesBlock({ content }: FeaturesBlockProps) {
  if (!content || content.length === 0) return null;

  const t = surfaceTokens();

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className={`text-3xl font-bold tracking-tight sm:text-4xl ${t.heading}`}
            style={{ fontFamily: "var(--heading-font, inherit)" }}
          >
            Ominaisuudet
          </h2>
          <p
            className={`mt-2 text-lg leading-8 ${t.body}`}
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
                className={`flex flex-col items-start rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow ${t.card}`}
              >
                {order.map((fieldKey) => {
                  const rendered = renderFeatureField(feature, fieldKey, t);
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
