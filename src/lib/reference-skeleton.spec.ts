import { describe, expect, it } from "vitest";
import { analyzeCss, buildReferenceSkeleton, isEmptyShell } from "./reference-skeleton";

const PAGE = new URL("https://example.com/about/");

const HTML = `<!doctype html><html><head>
<title> Acme – Parempi tapa </title>
<meta name="description" content="Acme tekee asioita.">
<meta property="og:image" content="/og.jpg">
<link rel="stylesheet" href="/css/site.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Inter">
<style>:root{--brand-primary:#ff5500;--radius-lg:12px;--spacing-4:1rem}h1{font-family:"Space Grotesk",sans-serif;color:#111}</style>
<script>window.track()</script>
</head><body>
<div class="wrapper"><div class="inner">
<header class="site-header js-sticky"><nav><a href="#hinnat">Hinnat</a><a href="/blog">Blogi</a></nav></header>
</div></div>
<section class="hero grid md:grid-cols-2">
  <div><h1 class="text-6xl">Parempi tapa tehdä töitä</h1><p>Lyhyt kuvaus.</p><a class="btn" href="/signup">Aloita</a></div>
  <img src="/img/hero.png" alt="Tuotekuva">
</section>
<section class="features"><h2>Miksi Acme</h2><ul><li>Nopea</li><li>Turvallinen</li><li>Edullinen</li></ul></section>
<svg><path d="M0"/></svg>
<footer><p>© Acme</p></footer>
</body></html>`;

describe("buildReferenceSkeleton", () => {
  const skeleton = buildReferenceSkeleton(HTML, PAGE);

  it("poimii otsikon, kuvauksen ja tyylitiedostot", () => {
    expect(skeleton.title).toBe("Acme – Parempi tapa");
    expect(skeleton.description).toBe("Acme tekee asioita.");
    expect(skeleton.stylesheets).toEqual(["https://example.com/css/site.css"]);
  });

  it("rakentaa rungon ilman skriptejä ja svg:itä ja sulauttaa pelkät kääreet", () => {
    expect(skeleton.outline).toContain('h1.text-6xl "Parempi tapa tehdä töitä"');
    expect(skeleton.outline).toContain("section.hero grid md:grid-cols-2");
    expect(skeleton.outline).toContain('a "Hinnat" →#hinnat');
    expect(skeleton.outline).toContain('img alt="Tuotekuva"');
    expect(skeleton.outline).not.toContain("track");
    expect(skeleton.outline).not.toContain("path");
    expect(skeleton.outline).not.toContain("wrapper");
    expect(skeleton.outline).not.toContain("js-sticky");
  });

  it("lukee fontit, värit ja teemamuuttujat", () => {
    expect(skeleton.fonts).toEqual(["Space Grotesk", "Inter"]);
    expect(skeleton.colors).toContain("#ff5500");
    expect(skeleton.colors).toContain("#111111");
    expect(skeleton.cssVars).toEqual({ "--brand-primary": "#ff5500", "--radius-lg": "12px" });
  });

  it("kerää kuvat absoluuttisina", () => {
    expect(skeleton.images).toEqual(["https://example.com/og.jpg", "https://example.com/img/hero.png"]);
  });

  it("tunnistaa oikean sivun", () => {
    expect(isEmptyShell(skeleton)).toBe(false);
  });

  it("katkaisee pitkät tekstit ja kertoo pituuden", () => {
    const long = "a ".repeat(200);
    const s = buildReferenceSkeleton(`<body><p>${long}</p></body>`, PAGE);
    expect(s.outline).toMatch(/…" \(399 merkkiä\)/);
  });
});

describe("toistuvat sisarukset", () => {
  it("näyttää kaksi ensimmäistä ja kertoo loput", () => {
    const cards = Array.from({ length: 6 }, (_, i) => `<div class="card"><h3>Kortti ${i + 1}</h3><p>Teksti</p></div>`).join("");
    const s = buildReferenceSkeleton(`<body><section>${cards}</section></body>`, PAGE);
    expect(s.outline).toContain('"Kortti 2"');
    expect(s.outline).not.toContain('"Kortti 3"');
    expect(s.outline).toContain("… +4 samanlaista");
  });

  it("listan kohdan rakenne avataan eikä tekstiä yhdistetä", () => {
    const s = buildReferenceSkeleton('<body><ul><li><a href="/a">Yksi</a><a href="/b">Kaksi</a></li><li>x</li></ul></body>', PAGE);
    expect(s.outline).not.toContain("YksiKaksi");
    expect(s.outline).toContain('a "Yksi"');
  });
});

describe("isEmptyShell", () => {
  it("tunnistaa client-renderöidyn sivun", () => {
    const s = buildReferenceSkeleton('<html><body><div id="root"></div><script src="/app.js"></script></body></html>', PAGE);
    expect(isEmptyShell(s)).toBe(true);
  });
});

describe("analyzeCss", () => {
  it("laskee värit yleisyyden mukaan ja ohittaa geneeriset fontit", () => {
    const css = "a{color:#FFF}b{color:#ffffff}c{color:#000}d{font-family:Lato, sans-serif}e{font-family:sans-serif}f{font-family:var(--x)}g{font-family:webflow-icons}h{font-family:unset}";
    const result = analyzeCss(css);
    expect(result.colors[0]).toBe("#ffffff");
    expect(result.fonts).toEqual(["Lato"]);
  });
});
