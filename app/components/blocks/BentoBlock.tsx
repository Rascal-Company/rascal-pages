"use client";

import type {
  BentoContent,
  BentoItem,
  ImageDisplay,
} from "@/src/lib/templates";
import type { SiteId } from "@/src/lib/types";
import { BENTO_COLUMNS, isBoxed, itemsInReadingOrder } from "@/src/lib/bento";
import { surfaceTokens } from "./appearance";
import { imageRoundingClassName } from "@/src/lib/image-display";

type BentoBlockProps = {
  content: BentoContent;
  theme: { primaryColor: string; appearance?: "light" | "dark" };
  siteId: SiteId;
  isPreview?: boolean;
};

function BentoElement({
  item,
  primaryColor,
  tokens,
  imageDisplay,
}: {
  item: BentoItem;
  primaryColor: string;
  tokens: ReturnType<typeof surfaceTokens>;
  imageDisplay?: ImageDisplay;
}) {
  switch (item.type) {
    case "heading":
      return (
        <h3
          className={`text-2xl font-bold tracking-tight sm:text-3xl ${tokens.heading}`}
          style={{ fontFamily: "var(--heading-font, inherit)" }}
        >
          {item.text}
        </h3>
      );
    case "text":
      return (
        <p
          className={`leading-relaxed ${tokens.body}`}
          style={{ fontFamily: "var(--body-font, inherit)" }}
        >
          {item.text}
        </p>
      );
    case "image":
      return item.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.url}
          alt={item.text || ""}
          className={`h-full w-full object-cover ${
            imageDisplay ? imageRoundingClassName(imageDisplay) : "rounded-xl"
          }`}
        />
      ) : null;
    case "button":
      return (
        <a
          href={item.url || "#"}
          className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          {item.text || "Nappi"}
        </a>
      );
    case "stat":
      return (
        <div>
          <div
            className={`text-3xl font-bold sm:text-4xl ${tokens.heading}`}
            style={{ fontFamily: "var(--heading-font, inherit)" }}
          >
            {item.value}
          </div>
          <div className={`mt-1 text-sm ${tokens.muted}`}>{item.label}</div>
        </div>
      );
    case "card":
      return (
        <div className="flex h-full flex-col">
          {item.text && (
            <h3
              className={`text-xl font-semibold ${tokens.heading}`}
              style={{ fontFamily: "var(--heading-font, inherit)" }}
            >
              {item.text}
            </h3>
          )}
          {item.body && (
            <p
              className={`mt-2 flex-1 leading-relaxed ${tokens.body}`}
              style={{ fontFamily: "var(--body-font, inherit)" }}
            >
              {item.body}
            </p>
          )}
          {item.tags && item.tags.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {item.tags.map((tag, i) => (
                <li
                  key={i}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${tokens.chip}`}
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
          {item.url && (
            <a
              href={item.url}
              className="mt-4 text-sm font-semibold hover:underline"
              style={{ color: primaryColor }}
            >
              {item.label || "Lue lisää"} →
            </a>
          )}
        </div>
      );
    default:
      return null;
  }
}

export default function BentoBlock({ content, theme }: BentoBlockProps) {
  if (!content || content.items.length === 0) return null;

  const primaryColor = theme.primaryColor || "#3B82F6";
  const t = surfaceTokens();

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/*
          On md+ this is a 12-column snap grid driven by each item's
          {x,y,w,h} (exposed as --bento-col/--bento-row CSS vars). Below md it
          collapses to a single flowing column — the placement vars are simply
          not applied — so the fixed grid never breaks on mobile.
        */}
        <style>{`
          .bento-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
          @media (min-width: 768px) {
            .bento-grid {
              grid-template-columns: repeat(${BENTO_COLUMNS}, minmax(0, 1fr));
              grid-auto-rows: minmax(80px, auto);
            }
            .bento-grid > .bento-item {
              grid-column: var(--bento-col);
              grid-row: var(--bento-row);
            }
          }
        `}</style>
        <div className="bento-grid">
          {itemsInReadingOrder(content.items).map((item) => (
            <div
              key={item.id}
              className={`bento-item flex flex-col justify-center overflow-hidden rounded-2xl ${
                item.type === "image" ? "" : "p-6"
              } ${isBoxed(item) ? t.card : ""}`}
              style={
                {
                  ["--bento-col" as string]: `${item.x + 1} / span ${item.w}`,
                  ["--bento-row" as string]: `${item.y + 1} / span ${item.h}`,
                } as React.CSSProperties
              }
            >
              <BentoElement
                item={item}
                primaryColor={primaryColor}
                tokens={t}
                imageDisplay={content.imageDisplay}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
