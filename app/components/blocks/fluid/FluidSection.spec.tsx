// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import FluidSection from "./FluidSection";
import { FluidEditorProvider, type FluidEditorApi } from "./FluidEditorContext";
import { SectionEditProvider } from "../SectionEditContext";
import type { FluidBlockId, FluidContent } from "@/src/lib/fluid";
import type { SectionId } from "@/src/lib/types";

const sectionId = "s1" as SectionId;
const content: FluidContent = {
  blocks: [
    {
      id: "t1" as FluidBlockId,
      type: "text",
      desktop: { x: 0, y: 0, w: 16, h: 4 },
      content: { variant: "h1", text: "Otsikko", align: "left" },
    },
    {
      id: "b1" as FluidBlockId,
      type: "button",
      desktop: { x: 2, y: 6, w: 5, h: 2 },
      content: { label: "Osta", href: "/osta", variant: "primary", align: "left" },
    },
  ],
};

function renderEditable(api: Partial<FluidEditorApi> = {}) {
  const editor: FluidEditorApi = {
    layout: "desktop",
    selection: null,
    select: vi.fn(),
    commit: vi.fn(),
    ...api,
  };
  const utils = render(
    <SectionEditProvider editable updateField={() => {}}>
      <FluidEditorProvider value={editor}>
        <FluidSection sectionId={sectionId} content={content} />
      </FluidEditorProvider>
    </SectionEditProvider>,
  );
  const grid = utils.container.querySelector(".fluid-grid") as HTMLElement;
  // happy-dom ei laske asettelua: 1000 px leveä ruudukko → sarakeväli (1000+16)/24.
  Object.defineProperty(grid, "clientWidth", { value: 1000 });
  return { ...utils, editor, grid };
}

describe("FluidSection (julkaistu)", () => {
  it("sijoittaa lohkot ruudukkoon työpöytä- ja mobiilimuuttujilla", () => {
    const { container } = render(<FluidSection sectionId={sectionId} content={content} />);
    const blocks = container.querySelectorAll<HTMLElement>(".fluid-block");
    expect(blocks).toHaveLength(2);
    expect(blocks[0].style.getPropertyValue("--d-c")).toBe("1 / span 16");
    expect(blocks[1].style.getPropertyValue("--d-r")).toBe("7 / span 2");
    // Automaattinen mobiili: täysleveät allekkain.
    expect(blocks[1].style.getPropertyValue("--m-c")).toBe("1 / span 8");
    expect(container.querySelector("h1")?.textContent).toBe("Otsikko");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/osta");
  });
});

describe("FluidSection (editori)", () => {
  it("raahaus siirtää lohkoa ruudukossa ja tallentaa yhden muutoksen", () => {
    const { container, editor } = renderEditable();
    const button = container.querySelectorAll<HTMLElement>(".fluid-block")[1];

    fireEvent.pointerDown(button, { button: 0, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(document, { clientX: 300, clientY: 148 });
    fireEvent.pointerUp(document, { clientX: 300, clientY: 148 });

    expect(editor.select).toHaveBeenCalledWith(sectionId, "b1");
    expect(editor.commit).toHaveBeenCalledTimes(1);
    const committed = vi.mocked(editor.commit).mock.calls[0][1];
    // 200 px / 42,33 px ≈ 5 saraketta, 48 px / 24 px = 2 riviä.
    expect(committed.blocks[1].desktop).toEqual({ x: 7, y: 8, w: 5, h: 2 });
    expect(committed.blocks[0]).toBe(content.blocks[0]);
  });

  it("pelkkä klikkaus valitsee lohkon tallentamatta", () => {
    const { container, editor } = renderEditable();
    const text = container.querySelectorAll<HTMLElement>(".fluid-block")[0];
    fireEvent.pointerDown(text, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(document, { clientX: 11, clientY: 11 });
    expect(editor.select).toHaveBeenCalledWith(sectionId, "t1");
    expect(editor.commit).not.toHaveBeenCalled();
  });

  it("kulmakahva muuttaa kokoa", () => {
    const { container, editor } = renderEditable({
      selection: { sectionId, blockId: "b1" as FluidBlockId },
    });
    const block = container.querySelectorAll<HTMLElement>(".fluid-block")[1];
    const handle = block.querySelector<HTMLElement>(".cursor-nwse-resize.-bottom-1\\.5");
    expect(handle).not.toBeNull();
    fireEvent.pointerDown(handle!, { button: 0, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(document, { clientX: 85, clientY: 0 });
    fireEvent.pointerUp(document);
    const committed = vi.mocked(editor.commit).mock.calls[0][1];
    expect(committed.blocks[1].desktop).toEqual({ x: 2, y: 6, w: 7, h: 2 });
  });

  it("mobiilissa muokkaus koskee mobiiliasettelua eikä työpöytää", () => {
    const { container, editor } = renderEditable({ layout: "mobile" });
    const button = container.querySelectorAll<HTMLElement>(".fluid-block")[1];
    fireEvent.pointerDown(button, { button: 0, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(document, { clientX: 0, clientY: 40 });
    fireEvent.pointerUp(document);
    const committed = vi.mocked(editor.commit).mock.calls[0][1];
    expect(committed.blocks[1].desktop).toEqual(content.blocks[1].desktop);
    expect(committed.blocks[1].mobile).toBeDefined();
    expect(committed.blocks[0].mobile).toBeDefined();
  });
});
