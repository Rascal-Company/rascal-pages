"use client";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { useMemo } from "react";
import { nanoid } from "nanoid";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import type { Layout, LayoutItem } from "react-grid-layout/legacy";
import type {
  BentoContent,
  BentoElementType,
  BentoItem,
} from "@/src/lib/templates";
import { parseTagList, formatTagList } from "@/src/lib/templates";
import {
  BENTO_COLUMNS,
  BENTO_DEFAULT_SIZE,
  nextFreeY,
  isBoxed,
} from "@/src/lib/bento";
import ImageDisplayControls from "../fields/ImageDisplayControls";

const ResponsiveGridLayout = WidthProvider(Responsive);

/** Neutral WYSIWYG preview of an element, shown inside the draggable grid box. */
function BentoPreview({ item }: { item: BentoItem }) {
  switch (item.type) {
    case "heading":
      return (
        <span className="text-lg font-bold leading-tight text-foreground">
          {item.text || "Otsikko"}
        </span>
      );
    case "text":
      return (
        <span className="text-xs leading-snug text-muted-foreground">
          {item.text || "Tekstisisältö"}
        </span>
      );
    case "image":
      return item.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.url}
          alt=""
          className="h-full w-full rounded object-cover"
        />
      ) : (
        <span className="text-xs text-muted-foreground">Kuva</span>
      );
    case "button":
      return (
        <span className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-white">
          {item.text || "Nappi"}
        </span>
      );
    case "stat":
      return (
        <span className="flex flex-col items-center">
          <span className="text-xl font-bold text-foreground">
            {item.value || "100+"}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {item.label || "Kuvaus"}
          </span>
        </span>
      );
    case "card":
      return (
        <span className="flex flex-col items-start text-left">
          <span className="text-sm font-semibold text-foreground">
            {item.text || "Kortin otsikko"}
          </span>
          {item.body && (
            <span className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">
              {item.body}
            </span>
          )}
        </span>
      );
    default:
      return null;
  }
}

type BentoBlockEditorProps = {
  content: BentoContent;
  onUpdate: (content: BentoContent) => void;
};

const inputClass =
  "block w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm";

const PALETTE: { type: BentoElementType; label: string }[] = [
  { type: "heading", label: "+ Otsikko" },
  { type: "text", label: "+ Teksti" },
  { type: "card", label: "+ Kortti" },
  { type: "image", label: "+ Kuva" },
  { type: "button", label: "+ Nappi" },
  { type: "stat", label: "+ Stat" },
];

const TYPE_LABELS: Record<BentoElementType, string> = {
  heading: "Otsikko",
  text: "Teksti",
  image: "Kuva",
  button: "Nappi",
  stat: "Stat",
  card: "Kortti",
};

function defaultItem(type: BentoElementType, items: BentoItem[]): BentoItem {
  const { w, h } = BENTO_DEFAULT_SIZE[type];
  const base = { id: nanoid(), type, x: 0, y: nextFreeY(items), w, h };
  if (type === "stat") return { ...base, value: "100+", label: "Kuvaus" };
  if (type === "card")
    return {
      ...base,
      text: "Kortin otsikko",
      body: "Lyhyt kuvaus.",
      tags: [],
    };
  return { ...base, text: TYPE_LABELS[type] };
}

export default function BentoBlockEditor({
  content,
  onUpdate,
}: BentoBlockEditorProps) {
  const items = useMemo(() => content.items || [], [content.items]);

  const layout = useMemo<LayoutItem[]>(
    () =>
      items.map((item) => ({
        i: item.id,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      })),
    [items],
  );

  const addItem = (type: BentoElementType) => {
    onUpdate({ ...content, items: [...items, defaultItem(type, items)] });
  };

  const updateItem = (id: string, patch: Partial<BentoItem>) => {
    onUpdate({
      ...content,
      items: items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  };

  const removeItem = (id: string) => {
    onUpdate({ ...content, items: items.filter((item) => item.id !== id) });
  };

  const onLayoutChange = (next: Layout) => {
    const byId = new Map(next.map((l) => [l.i, l]));
    onUpdate({
      ...content,
      items: items.map((item) => {
        const l = byId.get(item.id);
        return l ? { ...item, x: l.x, y: l.y, w: l.w, h: l.h } : item;
      }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PALETTE.map((p) => (
          <button
            key={p.type}
            onClick={() => addItem(p.type)}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
          >
            {p.label}
          </button>
        ))}
      </div>

      {items.some((item) => item.type === "image" && item.url) && (
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Kuvien pyöristys
          </label>
          <ImageDisplayControls
            variant="card"
            fields={["rounding"]}
            value={content.imageDisplay}
            onChange={(patch) =>
              onUpdate({
                ...content,
                imageDisplay: { ...content.imageDisplay, ...patch },
              })
            }
          />
        </div>
      )}

      {items.length > 0 && (
        <div className="rounded-md border border-border bg-muted p-2">
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout, md: layout, sm: layout, xs: layout }}
            breakpoints={{ lg: 0 }}
            cols={{ lg: BENTO_COLUMNS }}
            rowHeight={56}
            margin={[8, 8]}
            isResizable
            isDraggable
            compactType={null}
            preventCollision
            onLayoutChange={onLayoutChange}
          >
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-center overflow-hidden rounded-md p-2 text-center ${
                  item.type === "image"
                    ? "p-0"
                    : isBoxed(item)
                      ? "border border-input bg-card shadow-sm"
                      : "border border-dashed border-border"
                }`}
              >
                <span className="pointer-events-none flex max-h-full items-center justify-center overflow-hidden">
                  <BentoPreview item={item} />
                </span>
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="rounded-md border border-border bg-muted p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {TYPE_LABELS[item.type]} {index + 1}
              </span>
              <button
                onClick={() => removeItem(item.id)}
                className="text-sm text-destructive hover:text-destructive"
              >
                Poista
              </button>
            </div>

            {(item.type === "heading" ||
              item.type === "text" ||
              item.type === "button") && (
              <input
                type="text"
                value={item.text || ""}
                onChange={(e) => updateItem(item.id, { text: e.target.value })}
                placeholder={
                  item.type === "button" ? "Napin teksti" : "Tekstisisältö"
                }
                className={inputClass}
              />
            )}

            {(item.type === "image" || item.type === "button") && (
              <input
                type="url"
                value={item.url || ""}
                onChange={(e) => updateItem(item.id, { url: e.target.value })}
                placeholder={
                  item.type === "image"
                    ? "Kuvan URL"
                    : "Linkin osoite (https://...)"
                }
                className={inputClass}
              />
            )}

            {item.type === "card" && (
              <>
                <input
                  type="text"
                  value={item.text || ""}
                  onChange={(e) =>
                    updateItem(item.id, { text: e.target.value })
                  }
                  placeholder="Kortin otsikko"
                  className={inputClass}
                />
                <textarea
                  value={item.body || ""}
                  onChange={(e) =>
                    updateItem(item.id, { body: e.target.value })
                  }
                  placeholder="Kuvaus"
                  rows={3}
                  className={inputClass}
                />
                <input
                  type="text"
                  value={formatTagList(item.tags || [])}
                  onChange={(e) =>
                    updateItem(item.id, { tags: parseTagList(e.target.value) })
                  }
                  placeholder="Avainsanat (pilkulla eroteltuna)"
                  className={inputClass}
                />
                <input
                  type="url"
                  value={item.url || ""}
                  onChange={(e) => updateItem(item.id, { url: e.target.value })}
                  placeholder="Linkki (valinnainen)"
                  className={inputClass}
                />
              </>
            )}

            {item.type === "stat" && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={item.value || ""}
                  onChange={(e) =>
                    updateItem(item.id, { value: e.target.value })
                  }
                  placeholder="100+"
                  className={`${inputClass} w-28`}
                />
                <input
                  type="text"
                  value={item.label || ""}
                  onChange={(e) =>
                    updateItem(item.id, { label: e.target.value })
                  }
                  placeholder="Kuvaus"
                  className={inputClass}
                />
              </div>
            )}

            {item.type !== "image" && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={isBoxed(item)}
                  onChange={(e) =>
                    updateItem(item.id, { boxed: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                />
                Korosta laatikkona
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
