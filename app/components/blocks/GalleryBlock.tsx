"use client";

import { cva } from "class-variance-authority";
import type { GalleryContent } from "@/src/lib/templates";
import type { SiteId } from "@/src/lib/types";
import { surfaceTokens } from "./appearance";
import EditableText from "./EditableText";

const galleryGridVariants = cva("mx-auto mt-12 grid grid-cols-2 gap-4", {
  variants: {
    columns: {
      2: "sm:grid-cols-2",
      3: "sm:grid-cols-2 lg:grid-cols-3",
      4: "sm:grid-cols-3 lg:grid-cols-4",
    },
  },
  defaultVariants: { columns: 3 },
});

type GalleryBlockProps = {
  content: GalleryContent;
  theme: { primaryColor: string; appearance?: "light" | "dark" };
  siteId: SiteId;
  isPreview?: boolean;
  templateId?: string;
};

export default function GalleryBlock({ content }: GalleryBlockProps) {
  const images = (content?.images ?? []).filter((image) => image.url);
  if (images.length === 0) return null;

  const t = surfaceTokens();

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {content.heading && (
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
        )}

        <div className={galleryGridVariants({ columns: content.columns })}>
          {images.map((image, index) => (
            <figure key={index} className="overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.alt || image.caption || ""}
                className="aspect-[4/3] w-full object-cover transition-transform duration-200 hover:scale-105"
              />
              {image.caption && (
                <figcaption className={`mt-2 text-sm ${t.muted}`}>
                  {image.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
