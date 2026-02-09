"use client";

import type { ReactNode } from "react";
import type { TestimonialItem } from "@/src/lib/templates";
import type { SiteId } from "@/src/lib/types";

type TestimonialsBlockProps = {
  content: TestimonialItem[];
  theme: { primaryColor: string };
  siteId: SiteId;
  isPreview?: boolean;
};

const DEFAULT_TESTIMONIAL_ORDER = ["avatar", "text", "name", "company"];

function renderTestimonialField(
  testimonial: TestimonialItem,
  fieldKey: string,
  primaryColor: string,
): ReactNode {
  switch (fieldKey) {
    case "avatar":
      return testimonial.avatar ? (
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: primaryColor }}
        >
          {testimonial.name?.charAt(0).toUpperCase() || "A"}
        </div>
      );
    case "text":
      return (
        <p
          className="text-gray-600 leading-relaxed"
          style={{ fontFamily: "var(--body-font, inherit)" }}
        >
          &ldquo;{testimonial.text}&rdquo;
        </p>
      );
    case "name":
      return (
        <p
          className="font-semibold text-gray-900"
          style={{ fontFamily: "var(--heading-font, inherit)" }}
        >
          {testimonial.name}
        </p>
      );
    case "company":
      return testimonial.company ? (
        <p className="text-sm text-gray-500">{testimonial.company}</p>
      ) : null;
    default:
      return null;
  }
}

export default function TestimonialsBlock({
  content,
  theme,
}: TestimonialsBlockProps) {
  if (!content || content.length === 0) return null;

  const primaryColor = theme.primaryColor || "#10B981";

  return (
    <section className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            style={{ fontFamily: "var(--heading-font, inherit)" }}
          >
            Suosittelut
          </h2>
          <p
            className="mt-2 text-lg leading-8 text-gray-600"
            style={{ fontFamily: "var(--body-font, inherit)" }}
          >
            Mitä asiakkaat sanovat
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {content.map((testimonial, index) => {
            const order = testimonial.fieldOrder || DEFAULT_TESTIMONIAL_ORDER;
            return (
              <div
                key={index}
                className="flex flex-col gap-4 rounded-2xl bg-white p-8 shadow-sm"
              >
                <div className="flex items-center gap-x-1 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="h-5 w-5 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {order.map((fieldKey) => {
                  const rendered = renderTestimonialField(
                    testimonial,
                    fieldKey,
                    primaryColor,
                  );
                  return rendered ? (
                    <div key={fieldKey}>{rendered}</div>
                  ) : null;
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
