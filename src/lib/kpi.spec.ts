import { describe, expect, it } from "vitest";
import { conversionPercent, kpiWindows, percentChange, sumKpis } from "./kpi";

describe("percentChange", () => {
  it("laskee muutoksen pyöristettynä", () => {
    expect(percentChange({ current: 150, previous: 100 })).toBe(50);
    expect(percentChange({ current: 2, previous: 3 })).toBe(-33);
  });

  it("palauttaa nullin ilman vertailukohtaa", () => {
    expect(percentChange({ current: 5, previous: 0 })).toBeNull();
  });
});

describe("conversionPercent", () => {
  it("yksi desimaali, nolla ilman näyttöjä", () => {
    expect(conversionPercent(3, 120)).toBe(2.5);
    expect(conversionPercent(1, 3)).toBe(33.3);
    expect(conversionPercent(4, 0)).toBe(0);
  });
});

describe("kpiWindows", () => {
  it("antaa jakson ja vertailujakson alut", () => {
    const now = new Date("2026-10-31T00:00:00.000Z");
    expect(kpiWindows(now, 30)).toEqual({
      since: "2026-10-01T00:00:00.000Z",
      previousSince: "2026-09-01T00:00:00.000Z",
    });
  });
});

describe("sumKpis", () => {
  it("summaa sivustojen luvut", () => {
    const a = { views: { current: 10, previous: 5 }, leads: { current: 1, previous: 0 } };
    const b = { views: { current: 2, previous: 3 }, leads: { current: 2, previous: 1 } };
    expect(sumKpis([a, b])).toEqual({
      views: { current: 12, previous: 8 },
      leads: { current: 3, previous: 1 },
    });
    expect(sumKpis([]).views.current).toBe(0);
  });
});
