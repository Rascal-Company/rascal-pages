"use client";

import { cva } from "class-variance-authority";
import type { PricingContent } from "@/src/lib/templates";
import type { SiteId } from "@/src/lib/types";
import { surfaceTokens } from "./appearance";
import EditableText from "./EditableText";

const pricingGridVariants = cva(
  "mx-auto mt-16 grid max-w-md grid-cols-1 gap-8 sm:mt-20 lg:max-w-none",
  {
    variants: {
      columns: {
        2: "lg:grid-cols-2",
        3: "lg:grid-cols-3",
      },
    },
    defaultVariants: { columns: 3 },
  },
);

type PricingBlockProps = {
  content: PricingContent;
  theme: { primaryColor: string; appearance?: "light" | "dark" };
  siteId: SiteId;
  isPreview?: boolean;
  templateId?: string;
};

export default function PricingBlock({ content, theme }: PricingBlockProps) {
  if (!content || content.tiers.length === 0) return null;

  const primaryColor = theme.primaryColor || "#3B82F6";
  const t = surfaceTokens();

  return (
    <section id="hinnoittelu" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <EditableText
            as="h2"
            field="heading"
            value={content.heading}
            className={`text-3xl font-bold tracking-tight sm:text-4xl ${t.heading}`}
            style={{ fontFamily: "var(--heading-font, inherit)" }}
          />
          {content.subheading && (
            <EditableText
              as="p"
              field="subheading"
              value={content.subheading}
              className={`mt-4 text-lg leading-8 ${t.body}`}
              style={{ fontFamily: "var(--body-font, inherit)" }}
            />
          )}
        </div>

        <div className={pricingGridVariants({ columns: content.columns })}>
          {content.tiers.map((tier, index) => (
            <div
              key={index}
              className={`flex flex-col rounded-2xl p-8 shadow-sm ${t.card}`}
              style={
                tier.highlighted
                  ? { borderWidth: 2, borderColor: primaryColor }
                  : undefined
              }
            >
              <div className="flex items-center justify-between gap-x-4">
                <h3
                  className={`text-lg font-semibold ${t.heading}`}
                  style={{ fontFamily: "var(--heading-font, inherit)" }}
                >
                  {tier.name}
                </h3>
                {tier.highlighted && (
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Suosituin
                  </span>
                )}
              </div>

              <p className="mt-4 flex items-baseline gap-x-1">
                <span
                  className={`text-4xl font-bold tracking-tight ${t.heading}`}
                  style={{ fontFamily: "var(--heading-font, inherit)" }}
                >
                  {tier.price}
                </span>
                {tier.period && (
                  <span className={`text-sm font-medium ${t.muted}`}>
                    {tier.period}
                  </span>
                )}
              </p>

              {tier.description && (
                <p className={`mt-2 text-sm leading-6 ${t.body}`}>
                  {tier.description}
                </p>
              )}

              {tier.features.length > 0 && (
                <ul
                  className={`mt-8 flex-1 space-y-3 text-sm leading-6 ${t.body}`}
                >
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex gap-x-3">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 font-bold"
                        style={{ color: primaryColor }}
                      >
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              )}

              {tier.ctaText && (
                <a
                  href={tier.ctaLink || "#"}
                  className="mt-8 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold shadow-sm transition-transform hover:-translate-y-0.5"
                  style={
                    tier.highlighted
                      ? { backgroundColor: primaryColor, color: "#ffffff" }
                      : {
                          color: primaryColor,
                          boxShadow: `inset 0 0 0 1px ${primaryColor}`,
                        }
                  }
                >
                  {tier.ctaText}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
