"use client";

import { nanoid } from "nanoid";
import { Heading, Image as ImageIcon, MousePointerClick, RotateCcw, Type } from "lucide-react";
import type { SectionContentMap } from "@/src/lib/templates";
import type { SectionId } from "@/src/lib/types";
import { newBlock, readingOrder, type FluidBlock, type FluidBlockType, type TextVariant } from "@/src/lib/fluid";
import { useFluidEditor } from "@/app/components/blocks/fluid/FluidEditorContext";

const ADD: { type: FluidBlockType; label: string; icon: typeof Type; variant?: TextVariant; text?: string }[] = [
  { type: "text", label: "Otsikko", icon: Heading, variant: "h2", text: "Uusi otsikko" },
  { type: "text", label: "Teksti", icon: Type, variant: "body", text: "Kirjoita tähän" },
  { type: "image", label: "Kuva", icon: ImageIcon },
  { type: "button", label: "Painike", icon: MousePointerClick },
];

const TYPE_LABEL: Record<FluidBlockType, string> = { text: "Teksti", image: "Kuva", button: "Painike" };

function blockSummary(block: FluidBlock): string {
  if (block.type === "text") return block.content.text;
  if (block.type === "button") return block.content.label;
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
