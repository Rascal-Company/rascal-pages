"use client";

import type { CSSProperties } from "react";
import { ImagePlus } from "lucide-react";
import type { FluidBlock, FluidTextContent, TextVariant } from "@/src/lib/fluid";
import { cn } from "@/src/lib/utils";
import { useComponentRenderer } from "./FluidRenderContext";

const TEXT_STYLE: Record<TextVariant, { tag: "h1" | "h2" | "h3" | "p"; className: string; heading: boolean }> = {
  display: {
    tag: "h1",
    className: "text-5xl font-semibold leading-[1.02] tracking-[-0.03em] md:text-7xl",
    heading: true,
  },
  h1: {
    tag: "h1",
    className: "text-4xl font-semibold leading-[1.05] tracking-[-0.025em] md:text-6xl",
    heading: true,
  },
  h2: {
    tag: "h2",
    className: "text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-4xl",
    heading: true,
  },
  h3: { tag: "h3", className: "text-xl font-semibold leading-snug md:text-2xl", heading: true },
  body: { tag: "p", className: "text-base leading-relaxed text-foreground/80 md:text-lg", heading: false },
  small: { tag: "p", className: "text-sm leading-relaxed text-muted-foreground", heading: false },
  eyebrow: {
    tag: "p",
    className: "text-xs font-semibold uppercase tracking-[0.18em] text-primary",
    heading: false,
  },
};

const ALIGN = { left: "text-left", center: "text-center", right: "text-right" } as const;
const JUSTIFY = { left: "justify-start", center: "justify-center", right: "justify-end" } as const;

export function textElementProps(content: FluidTextContent) {
  const style = TEXT_STYLE[content.variant] ?? TEXT_STYLE.body;
  return {
    Tag: style.tag,
    className: cn("whitespace-pre-line break-words", style.className, ALIGN[content.align]),
    style: {
      fontFamily: style.heading ? "var(--heading-font, inherit)" : "var(--body-font, inherit)",
    } satisfies CSSProperties,
  };
}

/** Lohkon sisältö. Sama näkymä julkaistulla sivulla ja editorissa. */
export default function FluidBlockView({
  block,
  editing = false,
}: {
  block: FluidBlock;
  /** Editorissa tyhjät kuvat näytetään paikkamerkkinä. */
  editing?: boolean;
}) {
  if (block.type === "text") {
    const { Tag, className, style } = textElementProps(block.content);
    return (
      <Tag className={className} style={style}>
        {block.content.text}
      </Tag>
    );
  }

  if (block.type === "image") {
    const { src, alt, fit, radius } = block.content;
    if (!src) {
      return editing ? (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-foreground/20 bg-foreground/[0.03] text-xs font-medium text-foreground/50"
          style={{ borderRadius: radius }}
        >
          <ImagePlus className="size-6" aria-hidden />
          Lisää kuva
        </div>
      ) : null;
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element -- käyttäjän kuva, mitat ruudukosta
      <img
        src={src}
        alt={alt}
        loading="lazy"
        draggable={false}
        className={cn("absolute inset-0 size-full", fit === "contain" ? "object-contain" : "object-cover")}
        style={{ borderRadius: radius }}
      />
    );
  }

  if (block.type === "component") {
    return <ComponentView block={block} />;
  }

  const { label, href, variant, align } = block.content;
  return (
    <div className={cn("flex h-full items-center", JUSTIFY[align])}>
      <a
        href={href || "#"}
        onClick={editing ? (e) => e.preventDefault() : undefined}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius,0.5rem)] text-sm font-semibold transition-[transform,background-color] active:scale-[0.98] motion-reduce:active:scale-100",
          variant === "primary" && "h-11 bg-primary px-6 text-primary-foreground hover:opacity-90",
          variant === "secondary" &&
            "h-11 border border-foreground/20 px-6 text-foreground hover:bg-foreground/5",
          variant === "link" && "text-primary underline-offset-4 hover:underline",
        )}
      >
        {label}
      </a>
    </div>
  );
}

function ComponentView({ block }: { block: Extract<FluidBlock, { type: "component" }> }) {
  const render = useComponentRenderer();
  // Valmiilla osioilla on omat sisäreunuksensa; ruudukko vain sijoittaa ne.
  return <div className="h-full [&>section]:py-0">{render?.(block) ?? null}</div>;
}
