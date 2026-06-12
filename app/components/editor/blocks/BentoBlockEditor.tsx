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
import { BENTO_COLUMNS, BENTO_DEFAULT_SIZE, nextFreeY } from "@/src/lib/bento";

const ResponsiveGridLayout = WidthProvider(Responsive);

type BentoBlockEditorProps = {
  content: BentoContent;
  onUpdate: (content: BentoContent) => void;
};

const inputClass =
  "block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm";

const PALETTE: { type: BentoElementType; label: string }[] = [
  { type: "heading", label: "+ Otsikko" },
  { type: "text", label: "+ Teksti" },
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
};

function defaultItem(type: BentoElementType, items: BentoItem[]): BentoItem {
  const { w, h } = BENTO_DEFAULT_SIZE[type];
  return {
    id: nanoid(),
    type,
    x: 0,
    y: nextFreeY(items),
    w,
    h,
    ...(type === "stat"
      ? { value: "100+", label: "Kuvaus" }
      : { text: TYPE_LABELS[type] }),
  };
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
    onUpdate({ items: [...items, defaultItem(type, items)] });
  };

  const updateItem = (id: string, patch: Partial<BentoItem>) => {
    onUpdate({
      items: items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  };

  const removeItem = (id: string) => {
    onUpdate({ items: items.filter((item) => item.id !== id) });
  };

  const onLayoutChange = (next: Layout) => {
    const byId = new Map(next.map((l) => [l.i, l]));
    onUpdate({
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
            className="rounded-md bg-brand-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-accent-hover"
          >
            {p.label}
          </button>
        ))}
      </div>

      {items.length > 0 && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-2">
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
                className="flex items-center justify-center overflow-hidden rounded-md border border-gray-300 bg-white text-center text-xs text-gray-600"
              >
                <span className="pointer-events-none px-1">
                  {TYPE_LABELS[item.type]}
                  {item.text ? `: ${item.text}` : ""}
                  {item.type === "stat" ? `: ${item.value}` : ""}
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
            className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {TYPE_LABELS[item.type]} {index + 1}
              </span>
              <button
                onClick={() => removeItem(item.id)}
                className="text-sm text-red-600 hover:text-red-700"
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
          </div>
        ))}
      </div>
    </div>
  );
}
