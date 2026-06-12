import { describe, expect, test } from "vitest";
import { recommendedDnsRecord } from "./vercel-domains";

describe(recommendedDnsRecord, () => {
  test("apex domain gets an A record at the root", () => {
    expect(recommendedDnsRecord("oma-firma.fi")).toEqual({
      type: "A",
      name: "@",
      value: "76.76.21.21",
    });
  });

  test("subdomain gets a CNAME on its label", () => {
    expect(recommendedDnsRecord("kampanja.oma-firma.fi")).toEqual({
      type: "CNAME",
      name: "kampanja",
      value: "cname.vercel-dns.com",
    });
  });

  test("deeper subdomain keeps the full sub-label path in the CNAME name", () => {
    expect(recommendedDnsRecord("a.b.example.com")).toEqual({
      type: "CNAME",
      name: "a.b",
      value: "cname.vercel-dns.com",
    });
  });

  test("www subdomain is a CNAME", () => {
    expect(recommendedDnsRecord("www.example.com").type).toBe("CNAME");
  });
});
