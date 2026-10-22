"use client";

import { nanoid } from "nanoid";
import { Heading, Image as ImageIcon, MousePointerClick, RotateCcw, Type } from "lucide-react";
import { SECTION_TYPE_LABELS, type SectionContentMap } from "@/src/lib/templates";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { getDefaultSectionContent } from "../utils/contentUtils";
import type { SectionId } from "@/src/lib/types";
import {
  autoMobileLayout,
  newBlock,
  newComponentBlock,
  readingOrder,
  rectFor,
  rowCount,
  slugifyAnchor,
  withMinRows,
  type FluidBlock,
  type FluidBlockType,
  type TextVariant,
} from "@/src/lib/fluid";
import { COMPONENT_TYPES } from "@/app/components/blocks/fluid/FluidSection";
import { useFluidEditor } from "@/app/components/blocks/fluid/FluidEditorContext";

const ADD: { type: "text" | "image" | "button"; label: string; icon: typeof Type; variant?: TextVariant; text?: string }[] = [
  { type: "text", label: "Otsikko", icon: Heading, variant: "h2", text: "Uusi otsikko" },
  { type: "text", label: "Teksti", icon: Type, variant: "body", text: "Kirjoita tähän" },
  { type: "image", label: "Kuva", icon: ImageIcon },
  { type: "button", label: "Painike", icon: MousePointerClick },
];

const TYPE_LABEL: Record<FluidBlockType, string> = {
  text: "Teksti",
  image: "Kuva",
  button: "Painike",
  component: "Osio",
};

function blockSummary(block: FluidBlock): string {
  if (block.type === "text") return block.content.text;
  if (block.type === "button") return block.content.label;
  if (block.type === "component") return SECTION_TYPE_LABELS[block.content.sectionType];
  return block.content.alt || (block.content.src ? "Kuva" : "Tyhjä kuva");
}

/** Vapaan osion tarkastin: lohkot lukujärjestyksessä ja uuden lohkon lisäys. */
export default function FluidSectionEditor({
  sectionId,
  content,
  onUpdate,
}: {
  sectionId: SectionId;
  content: SectionContentMap["fluid"];
  onUpdate: (content: SectionContentMap["fluid"]) => void;
}) {
  const fluid = useFluidEditor();
  const blocks = content.blocks ?? [];
  const hasMobileLayout = blocks.some((b) => b.mobile);

  function add(option: (typeof ADD)[number]) {
    const block = newBlock(option.type, nanoid(10), blocks, {
      ...(option.variant && { variant: option.variant }),
      ...(option.text && { text: option.text }),
    });
    onUpdate({ ...content, blocks: [...blocks, block] });
    fluid?.select(sectionId, block.id);
  }

  function addComponent(type: (typeof COMPONENT_TYPES)[number]) {
    const block = newComponentBlock(type, getDefaultSectionContent(type), nanoid(10), blocks);
    onUpdate({ ...content, blocks: [...blocks, block] });
    fluid?.select(sectionId, block.id);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Lisää lohko</p>
        <div className="grid grid-cols-4 gap-1.5">
          {ADD.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => add(option)}
              className="flex flex-col items-center gap-1 rounded-lg border border-border py-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground active:scale-[0.97]"
            >
              <option.icon className="size-4" aria-hidden />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-muted-foreground" htmlFor="add-component">
          Lisää valmis osio
        </label>
        <select
          id="add-component"
          value=""
          onChange={(e) => e.target.value && addComponent(e.target.value as (typeof COMPONENT_TYPES)[number])}
          className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm"
        >
          <option value="">Valitse…</option>
          {COMPONENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {SECTION_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="nav-label" className="text-xs text-muted-foreground">
            Nimi navigaatiossa (tyhjä = ei näy)
          </Label>
          <Input
            id="nav-label"
            value={content.navLabel ?? ""}
            placeholder="Esim. Palvelut"
            onChange={(e) =>
              onUpdate({
                ...content,
                navLabel: e.target.value,
                anchor: content.anchor && content.anchor !== slugifyAnchor(content.navLabel ?? "")
                  ? content.anchor
                  : slugifyAnchor(e.target.value),
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="anchor" className="text-xs text-muted-foreground">
            Ankkuri (linkki #…)
          </Label>
          <Input
            id="anchor"
            value={content.anchor ?? ""}
            placeholder="palvelut"
            onChange={(e) => onUpdate({ ...content, anchor: slugifyAnchor(e.target.value) })}
          />
        </div>
      </div>

      <SectionHeightField content={content} onUpdate={onUpdate} />

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Lohkot ({blocks.length})</p>
        <ul className="space-y-1">
          {readingOrder(blocks).map((block) => (
            <li key={block.id}>
              <button
                type="button"
                onClick={() => fluid?.select(sectionId, block.id)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted"
              >
                <span className="w-14 shrink-0 text-[11px] text-muted-foreground">
                  {TYPE_LABEL[block.type]}
                </span>
                <span className="truncate">{blockSummary(block)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        Mobiiliasettelu:{" "}
        {hasMobileLayout ? "muokattu käsin." : "automaattinen (lohkot allekkain)."} Vaihda
        yläpalkista mobiilinäkymään muokataksesi sitä erikseen.
        {hasMobileLayout && (
          <button
            type="button"
            onClick={() =>
              onUpdate({
                ...content,
                blocks: blocks.map((b) => {
                  const copy = { ...b };
                  delete copy.mobile;
                  return copy;
                }),
              })
            }
            className="mt-2 flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <RotateCcw className="size-3" aria-hidden />
            Palauta automaattinen mobiiliasettelu
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Osion korkeus riveinä muokattavassa asettelussa. Tyhjä = automaattinen
 * (osio päättyy alimpaan lohkoon). Samaa voi säätää osion alareunan kahvasta.
 */
function SectionHeightField({
  content,
  onUpdate,
}: {
  content: SectionContentMap["fluid"];
  onUpdate: (content: SectionContentMap["fluid"]) => void;
}) {
  const fluid = useFluidEditor();
  const layout = fluid?.layout ?? "desktop";
  const blocks = content.blocks ?? [];
  const auto = autoMobileLayout(blocks);
  const rects = blocks.map((b) => rectFor(b, layout, auto));
  const minimum = rowCount(rects);
  const value = content.minRows?.[layout];

  return (
    <div className="space-y-1.5">
      <Label htmlFor="section-height" className="text-xs text-muted-foreground">
        Osion korkeus, rivejä ({layout === "desktop" ? "työpöytä" : "mobiili"})
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id="section-height"
          key={`${layout}-${value ?? "auto"}`}
          type="number"
          inputMode="numeric"
          min={minimum}
          defaultValue={value ?? ""}
          placeholder={`Automaattinen (${minimum})`}
          onBlur={(e) => {
            const rows = Number.parseInt(e.target.value, 10);
            onUpdate(withMinRows(content, layout, Number.isFinite(rows) ? rows : 0, rects));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="h-9 tabular-nums"
        />
        {value !== undefined && (
          <button
            type="button"
            onClick={() => onUpdate(withMinRows(content, layout, 0, rects))}
            className="shrink-0 text-xs font-medium text-primary hover:underline"
          >
            Automaattinen
          </button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Jätä tyhjää tilaa osion alle tai vedä osion alareunan kahvasta.
      </p>
    </div>
  );
}
