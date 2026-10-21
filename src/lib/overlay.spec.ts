import { describe, expect, it } from "vitest";
import {
  createOverlayVariantId,
  matchesPath,
  matchesQuery,
  parseChanges,
  parseMatch,
  parseTargetUrl,
  assignVariant,
  pickTarget,
  subdomainFromOrigin,
  type OverlayTargetRow,
} from "./overlay";

describe("parseTargetUrl", () => {
  it("lisää https:n ja erottaa polun", () => {
    expect(parseTargetUrl("asiakas.fi/hinnasto")).toEqual({
      origin: "https://asiakas.fi",
      path: "/hinnasto",
    });
  });

  it("hylkää muut skeemat ja hostit ilman pistettä", () => {
    expect(parseTargetUrl("javascript:alert(1)")).toBeNull();
    expect(parseTargetUrl("ftp://asiakas.fi")).toBeNull();
    expect(parseTargetUrl("http://localhost:3000")).toBeNull();
    expect(parseTargetUrl("https://user:pw@asiakas.fi")).toBeNull();
    expect(parseTargetUrl("")).toBeNull();
  });
});

describe("matchesPath", () => {
  it("tarkka polku, lopun kauttaviiva ei haittaa", () => {
    expect(matchesPath("/hinnasto", "/hinnasto/")).toBe(true);
    expect(matchesPath("/hinnasto", "/hinnasto/pro")).toBe(false);
    expect(matchesPath("/", "/")).toBe(true);
  });

  it("jokerimerkki", () => {
    expect(matchesPath("*", "/mika/tahansa")).toBe(true);
    expect(matchesPath("/blogi/*", "/blogi/eka")).toBe(true);
    expect(matchesPath("/blogi/*", "/tuotteet")).toBe(false);
  });

  it("ei tulkitse regex-merkkejä", () => {
    expect(matchesPath("/a.b", "/axb")).toBe(false);
  });
});

describe("matchesQuery", () => {
  it("tyhjä kohdennus täsmää kaikkiin", () => {
    expect(matchesQuery({}, {})).toBe(true);
  });

  it("kaikkien avainten pitää täsmätä, kirjainkoko ei haittaa", () => {
    const match = { utm_campaign: "Syksy", utm_content: "video1" };
    expect(matchesQuery(match, { utm_campaign: "syksy", utm_content: "VIDEO1" })).toBe(true);
    expect(matchesQuery(match, { utm_campaign: "syksy" })).toBe(false);
  });
});

describe("pickTarget", () => {
  const base = {
    target_origin: "https://asiakas.fi",
    path_pattern: "*",
    changes: [],
  };
  const variants: (OverlayTargetRow & { id: string })[] = [
    { ...base, id: createOverlayVariantId("all"), match: {}, updated_at: "2026-10-01" },
    {
      ...base,
      id: createOverlayVariantId("campaign"),
      match: { utm_campaign: "syksy" },
      updated_at: "2026-10-01",
    },
    {
      ...base,
      id: createOverlayVariantId("creative"),
      match: { utm_campaign: "syksy", utm_content: "video1" },
      updated_at: "2026-09-01",
    },
  ];

  it("valitsee tarkimmin kohdennetun", () => {
    const url = new URL("https://asiakas.fi/");
    expect(
      pickTarget(variants, url, { utm_campaign: "syksy", utm_content: "video1" })?.id,
    ).toBe("creative");
    expect(pickTarget(variants, url, { utm_campaign: "syksy" })?.id).toBe("campaign");
    expect(pickTarget(variants, url, {})?.id).toBe("all");
  });

  it("ei palauta toisen originin variantteja", () => {
    expect(pickTarget(variants, new URL("https://muu.fi/"), {})).toBeNull();
  });

  it("tasatilanteessa uusin voittaa", () => {
    const tie: (OverlayTargetRow & { id: string })[] = [
      { ...base, id: createOverlayVariantId("old"), match: {}, updated_at: "2026-01-01" },
      { ...base, id: createOverlayVariantId("new"), match: {}, updated_at: "2026-02-01" },
    ];
    expect(pickTarget(tie, new URL("https://asiakas.fi/"), {})?.id).toBe("new");
  });
});

describe("parseMatch", () => {
  it("pudottaa tyhjät ja tuntemattomat avaimet", () => {
    expect(parseMatch({ utm_campaign: " syksy ", utm_content: "", foo: "x" })).toEqual({
      utm_campaign: "syksy",
    });
    expect(parseMatch(null)).toEqual({});
  });
});

describe("parseChanges", () => {
  const valid = {
    id: "c1",
    selector: "#hero > h1",
    type: "text",
    value: "Uusi otsikko",
    original: "Vanha otsikko",
  };

  it("hyväksyy validin muutoksen", () => {
    const result = parseChanges([valid]);
    expect(result.ok).toBe(true);
  });

  it("tyhjentää hide-tyypin arvon", () => {
    const result = parseChanges([{ ...valid, type: "hide", value: "x" }]);
    expect(result.ok && result.changes[0].value).toBe("");
  });

  it("hylkää vaaralliset URL-skeemat", () => {
    expect(parseChanges([{ ...valid, type: "link", value: "javascript:alert(1)" }]).ok).toBe(false);
    expect(parseChanges([{ ...valid, type: "image", value: "data:image/svg+xml,x" }]).ok).toBe(false);
    expect(parseChanges([{ ...valid, type: "link", value: "https://asiakas.fi/tarjous" }]).ok).toBe(true);
  });

  it("hylkää tuntemattoman tyypin ja tyhjän tekstin", () => {
    expect(parseChanges([{ ...valid, type: "html" }]).ok).toBe(false);
    expect(parseChanges([{ ...valid, value: "  " }]).ok).toBe(false);
    expect(parseChanges("x").ok).toBe(false);
  });
});

describe("subdomainFromOrigin", () => {
  it("ottaa domainin ensimmäisen osan ilman www:tä ja erikoismerkkejä", () => {
    expect(subdomainFromOrigin("https://www.my-shop.fi")).toBe("myshop");
    expect(subdomainFromOrigin("https://Asiakas.co.uk")).toBe("asiakas");
  });

  it("palauttaa oletuksen, jos nimestä ei jää mitään", () => {
    expect(subdomainFromOrigin("https://---.fi")).toBe("overlay");
    expect(subdomainFromOrigin("roskaa")).toBe("overlay");
  });

  it("ei palauta varattua nimeä", () => {
    expect(subdomainFromOrigin("https://app.fi")).toBe("appsite");
    expect(subdomainFromOrigin("https://www.app.fi")).toBe("appsite");
  });
});

describe("assignVariant", () => {
  const variants = [{ id: "b" }, { id: "a" }, { id: "c" }];

  it("antaa samalle kävijälle aina saman variaation järjestyksestä riippumatta", () => {
    const first = assignVariant(variants, "kävijä-1", "lp");
    expect(assignVariant([...variants].reverse(), "kävijä-1", "lp")).toEqual(first);
  });

  it("jakaa kävijät kaikille variaatioille", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 3000; i++) {
      const v = assignVariant(variants, `v${i}`, "lp")!;
      counts.set(v.id, (counts.get(v.id) ?? 0) + 1);
    }
    for (const id of ["a", "b", "c"]) {
      expect(counts.get(id)).toBeGreaterThan(800);
    }
  });

  it("palauttaa nullin ilman variaatioita", () => {
    expect(assignVariant([], "x", "lp")).toBeNull();
  });
});
