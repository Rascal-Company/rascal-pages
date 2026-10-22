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

function renderEditable(api: Partial<FluidEditorApi> = {}, sectionContent: FluidContent = content, active = false) {
  const editor: FluidEditorApi = {
    layout: "desktop",
    selection: null,
    select: vi.fn(),
    selectMany: vi.fn(),
    commit: vi.fn(),
    ...api,
  };
  const utils = render(
    <SectionEditProvider editable updateField={() => {}}>
      <FluidEditorProvider value={editor}>
        <FluidSection sectionId={sectionId} content={sectionContent} active={active} />
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
      selection: { sectionId, blockIds: ["b1" as FluidBlockId] },
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

  it("Shift-klikkaus lisää lohkon valintaan", () => {
    const { container, editor } = renderEditable({
      selection: { sectionId, blockIds: ["t1" as FluidBlockId] },
    });
    const button = container.querySelectorAll<HTMLElement>(".fluid-block")[1];
    fireEvent.pointerDown(button, { button: 0, shiftKey: true, clientX: 0, clientY: 0 });
    expect(editor.selectMany).toHaveBeenCalledWith(sectionId, ["t1", "b1"]);
    expect(editor.commit).not.toHaveBeenCalled();
  });

  it("valitun ryhmän raahaus siirtää kaikkia valittuja", () => {
    const { container, editor } = renderEditable({
      selection: { sectionId, blockIds: ["t1", "b1"] as FluidBlockId[] },
    });
    const button = container.querySelectorAll<HTMLElement>(".fluid-block")[1];
    fireEvent.pointerDown(button, { button: 0, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(document, { clientX: 85, clientY: 48 });
    fireEvent.pointerUp(document);
    expect(editor.select).not.toHaveBeenCalled();
    const committed = vi.mocked(editor.commit).mock.calls[0][1];
    expect(committed.blocks[0].desktop).toEqual({ x: 2, y: 2, w: 16, h: 4 });
    expect(committed.blocks[1].desktop).toEqual({ x: 4, y: 8, w: 5, h: 2 });
  });

  it("nuolinäppäin siirtää koko valintaa ja Delete poistaa sen", () => {
    const { editor } = renderEditable({
      selection: { sectionId, blockIds: ["t1", "b1"] as FluidBlockId[] },
    });
    fireEvent.keyDown(document.body, { key: "ArrowDown" });
    const moved = vi.mocked(editor.commit).mock.calls[0][1];
    expect(moved.blocks.map((b) => b.desktop.y)).toEqual([1, 7]);
    fireEvent.keyDown(document.body, { key: "Delete" });
    expect(vi.mocked(editor.commit).mock.calls[1][1].blocks).toEqual([]);
  });

  it("valintalaatikko valitsee lohkot, joita se koskettaa", () => {
    const { container, editor, grid } = renderEditable();
    const [text, button] = container.querySelectorAll<HTMLElement>(".fluid-block");
    // happy-dom ei laske asettelua: annetaan lohkoille sijainnit.
    const box = (left: number, top: number, w: number, h: number) =>
      ({ left, top, right: left + w, bottom: top + h, width: w, height: h, x: left, y: top }) as DOMRect;
    text.getBoundingClientRect = () => box(0, 0, 600, 96);
    button.getBoundingClientRect = () => box(100, 150, 200, 48);
    grid.getBoundingClientRect = () => box(0, 0, 1000, 400);

    fireEvent.pointerDown(grid, { button: 0, clientX: 50, clientY: 140 });
    fireEvent.pointerMove(document, { clientX: 400, clientY: 220 });
    fireEvent.pointerUp(document);
    expect(editor.selectMany).toHaveBeenLastCalledWith(sectionId, ["b1"]);
  });

  it("osion alareunan kahva asettaa vähimmäiskorkeuden", () => {
    const { getByTitle, editor } = renderEditable({}, content, true);
    const handle = getByTitle("Vedä muuttaaksesi osion korkeutta");
    fireEvent.pointerDown(handle, { button: 0, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(document, { clientX: 0, clientY: 96 });
    fireEvent.pointerUp(document);
    // Lohkot päättyvät riville 8, +4 riviä = 12.
    expect(vi.mocked(editor.commit).mock.calls[0][1].minRows).toEqual({ desktop: 12 });
  });
});

describe("FluidSection (osion korkeus julkaistuna)", () => {
  it("lisää täyttösolun asetetulle riville", () => {
    const { container } = render(
      <FluidSection sectionId={sectionId} content={{ ...content, minRows: { desktop: 20 } }} />,
    );
    const spacer = container.querySelector<HTMLElement>(".fluid-spacer");
    expect(spacer?.style.getPropertyValue("--d-end")).toBe("20 / span 1");
    // Mobiilissa ei asetettu: viimeinen lohkorivi (automaattinen pinous).
    expect(spacer?.style.getPropertyValue("--m-end")).toBe("7 / span 1");
  });
});
