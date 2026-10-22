// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildSelector, canEditText, normalizeText } from "./overlay-selector";
import { assignVariant } from "./overlay";

type Change = { id: string; selector: string; type: string; value: string; original: string };
type OverlayApi = {
  apply: (changes: Change[], doc?: Document) => number;
  pick: (variants: { id: string }[], visitorId: string, landingPageId: string) => { id: string } | null;
};

beforeEach(() => {
  document.body.innerHTML = `
    <header id="top"><h1>Otsikko <span>tässä</span></h1></header>
    <main>
      <section><p>Eka</p><p>Toka</p></section>
      <section id="w-node-1a2b3c4d"><img src="/a.jpg" srcset="/a2.jpg 2x"><a href="/tilaa">Tilaa</a></section>
    </main>`;
});

describe("buildSelector", () => {
  it("käyttää pysyvää id:tä", () => {
    expect(buildSelector(document.getElementById("top")!)).toBe("#top");
  });

  it("rakentaa yksilöivän polun lähimmästä id:stä", () => {
    const span = document.querySelector("span")!;
    const sel = buildSelector(span);
    expect(sel.startsWith("#top > ")).toBe(true);
    expect(document.querySelector(sel)).toBe(span);
  });

  it("ohittaa generoidut id:t ja tekee polun bodysta", () => {
    const img = document.querySelector("img")!;
    const sel = buildSelector(img);
    expect(sel).not.toContain("w-node");
    expect(sel.startsWith("body > ")).toBe(true);
    expect(document.querySelector(sel)).toBe(img);
  });

  it("erottaa samantyyppiset sisarukset", () => {
    const toka = document.querySelectorAll("p")[1];
    expect(document.querySelector(buildSelector(toka))).toBe(toka);
  });
});

describe("canEditText / normalizeText", () => {
  it("sallii vain lapsettomat tekstielementit", () => {
    expect(canEditText(document.querySelector("h1")!)).toBe(false);
    expect(canEditText(document.querySelector("span")!)).toBe(true);
    expect(canEditText(document.querySelector("img")!)).toBe(false);
  });

  it("normalisoi välilyönnit", () => {
    expect(normalizeText("  a \n  b ")).toBe("a b");
  });
});

describe("o.js apply (sama logiikka snippetissä ja esikatselussa)", () => {
  let api: OverlayApi;

  beforeAll(() => {
    const source = readFileSync(
      path.resolve(__dirname, "../../public/overlay/o.js"),
      "utf8",
    );
    // document.currentScript on null → snippet vain paljastaa API:n.
    new Function(source)();
    api = (window as unknown as { __rpOverlay: OverlayApi }).__rpOverlay;
  });

  it("korvaa tekstin, kuvan, linkin ja piilottaa", () => {
    const img = document.querySelector("img")!;
    const changes: Change[] = [
      { id: "t", selector: "span", type: "text", value: "nyt", original: "tässä" },
      { id: "i", selector: buildSelector(img), type: "image", value: "/b.jpg", original: "/a.jpg" },
      { id: "l", selector: "a", type: "link", value: "/kampanja", original: "/tilaa" },
      { id: "h", selector: "header", type: "hide", value: "", original: "header" },
    ];
    expect(api.apply(changes)).toBe(4);
    expect(document.querySelector("span")!.textContent).toBe("nyt");
    expect(img.getAttribute("src")).toBe("/b.jpg");
    expect(img.hasAttribute("srcset")).toBe(false);
    expect(document.querySelector("a")!.getAttribute("href")).toBe("/kampanja");
    expect((document.querySelector("header") as HTMLElement).style.display).toBe("none");
  });

  it("ei korvaa, jos sormenjälki ei täsmää", () => {
    const changes: Change[] = [
      { id: "t", selector: "span", type: "text", value: "nyt", original: "jotain muuta" },
    ];
    expect(api.apply(changes)).toBe(0);
    expect(document.querySelector("span")!.textContent).toBe("tässä");
  });

  it("on idempotentti ja sallii arvon päivittämisen", () => {
    const change: Change = { id: "t", selector: "span", type: "text", value: "eka", original: "tässä" };
    api.apply([change]);
    expect(api.apply([{ ...change, value: "toka" }])).toBe(1);
    expect(document.querySelector("span")!.textContent).toBe("toka");
  });

  it("valitsee A/B-variaation samoin kuin palvelin (assignVariant)", () => {
    const variants = [{ id: "c3" }, { id: "a1" }, { id: "b2" }];
    for (let i = 0; i < 200; i++) {
      expect(api.pick(variants, `kävijä-${i}`, "lp-1")?.id).toBe(
        assignVariant(variants, `kävijä-${i}`, "lp-1")?.id,
      );
    }
  });

  it("vaihtaa kuvan myös <picture>-elementissä ja lazy load -attribuuteissa", () => {
    document.body.innerHTML = `<picture><source srcset="/a.webp" type="image/webp"><img src="/a.jpg" data-src="/a-big.jpg" sizes="100vw"></picture>`;
    const img = document.querySelector("img")!;
    const changes: Change[] = [
      { id: "i", selector: "picture > img", type: "image", value: "https://cdn.fi/b.jpg", original: "/a.jpg" },
    ];
    expect(api.apply(changes)).toBe(1);
    expect(img.getAttribute("src")).toBe("https://cdn.fi/b.jpg");
    expect(img.getAttribute("data-src")).toBe("https://cdn.fi/b.jpg");
    expect(img.hasAttribute("sizes")).toBe(false);
    expect(document.querySelectorAll("source")).toHaveLength(0);
  });
});

describe("buildSelector Pages-lohkoissa", () => {
  it("ankkuroituu lohkon pysyvään tunnisteeseen", () => {
    document.body.innerHTML = `
      <main><div class="fluid-grid">
        <div data-rp-block="abc123"><h2>Otsikko</h2></div>
        <div data-rp-block="cta-9"><div><a href="#x">Varaa</a></div></div>
      </div></main>`;
    const a = document.querySelector("a")!;
    const sel = buildSelector(a);
    expect(sel).toBe('[data-rp-block="cta-9"] > div:nth-of-type(1) > a:nth-of-type(1)');
    expect(document.querySelector(sel)).toBe(a);
    const wrapper = document.querySelector('[data-rp-block="abc123"]')!;
    expect(buildSelector(wrapper)).toBe('[data-rp-block="abc123"]');
  });
});
