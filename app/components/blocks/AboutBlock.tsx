"use client";

import type { CSSProperties, ReactNode } from "react";
import type { AboutContent } from "@/src/lib/templates";
import type { SiteId } from "@/src/lib/types";
import EditableText from "./EditableText";
import {
  imageBoxClassName,
  imagePosition,
  isBoxMode,
} from "@/src/lib/image-display";

type AboutBlockProps = {
  content: AboutContent;
  theme: { primaryColor: string; appearance?: "light" | "dark" };
  siteId: SiteId;
  isPreview?: boolean;
  templateId?: string;
};

const DEFAULT_ABOUT_ORDER = ["name", "bio", "image"];

type RenderOptions = {
  /** Render the legacy inline round avatar (only when no imageDisplay mode is set). */
  legacyImage: boolean;
  /** Force light text for readability over a background image. */
  forceLight: boolean;
};

function renderAboutField(
  content: AboutContent,
  fieldKey: string,
  isDark: boolean,
  isPortfolio: boolean,
  options: RenderOptions,
): ReactNode {
  switch (fieldKey) {
    case "name":
      return (
        <EditableText
          as="h2"
          field="name"
          value={content.name || "Tarina"}
          className={`mb-6 text-3xl font-bold tracking-tight sm:text-4xl ${
            options.forceLight
              ? "text-white"
              : isPortfolio
                ? "text-foreground"
                : "text-gray-900"
          }`}
          style={{ fontFamily: "var(--heading-font, inherit)" }}
        />
      );
    case "bio":
      return (
        <div
          className={`prose prose-lg max-w-none ${
            isDark || options.forceLight ? "prose-invert" : "prose-gray"
          }`}
        >
          <EditableText
            as="p"
            field="bio"
            value={content.bio}
            className={`text-lg leading-8 whitespace-pre-line ${
              options.forceLight
                ? "text-white/90"
                : isPortfolio
                  ? "text-muted-foreground"
                  : "text-gray-600"
            }`}
            style={{ fontFamily: "var(--body-font, inherit)" }}
          />
        </div>
      );
    case "image":
      return options.legacyImage && content.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={content.image}
          alt={content.name}
          className={`mb-8 h-28 w-28 rounded-full object-cover ${
            isPortfolio ? "ring-1 ring-border" : ""
          }`}
        />
      ) : null;
    default:
      return null;
  }
}

export default function AboutBlock({
  content,
  theme,
  templateId,
}: AboutBlockProps) {
  if (!content) return null;

  const isDark = theme.appearance === "dark";
  const isPortfolio = isDark || templateId === "portfolio";
  const order = content.fieldOrder || DEFAULT_ABOUT_ORDER;

  const display = content.imageDisplay;
  const hasImage = !!content.image;
  const boxImage = isBoxMode(display) && hasImage;
  const bgImage = display?.mode === "background" && hasImage;
  const legacyImage = !display?.mode;
  const imageOnLeft = imagePosition(display) === "left";

  const sectionStyle: CSSProperties = bgImage
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${content.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {};

  const renderOptions: RenderOptions = { legacyImage, forceLight: bgImage };

  const textColumn = (
    <div className={boxImage ? "" : "mx-auto max-w-3xl"}>
      {order.map((fieldKey) => {
        const rendered = renderAboutField(
          content,
          fieldKey,
          isDark,
          isPortfolio,
          renderOptions,
        );
        return rendered ? <div key={fieldKey}>{rendered}</div> : null;
      })}
    </div>
  );

  const imageColumn = boxImage ? (
    <div
      className={`flex ${
        imageOnLeft
          ? "justify-center lg:justify-start"
          : "justify-center lg:justify-end"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={content.image}
        alt={content.name || ""}
        className={imageBoxClassName(display)}
      />
    </div>
  ) : null;

  return (
    <section
      id="tarina"
      className={`py-24 sm:py-32 ${bgImage ? "text-white" : ""}`}
      style={sectionStyle}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {boxImage ? (
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {imageOnLeft && imageColumn}
            {textColumn}
            {!imageOnLeft && imageColumn}
          </div>
        ) : (
          textColumn
        )}
      </div>
    </section>
  );
}
