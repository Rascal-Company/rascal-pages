// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import SiteAdminNav from "./SiteAdminNav";

vi.mock("next/navigation", () => ({ usePathname: () => "/app/dashboard/s1/posts" }));

describe("SiteAdminNav", () => {
  it("näyttää sivuston osiot ja merkitsee nykyisen", () => {
    const { getByRole } = render(
      <SiteAdminNav siteId="s1" kind="pages" label="acme.fi" url="https://acme.fi" />,
    );
    const nav = getByRole("navigation", { name: "Sivuston osiot" });
    const links = Array.from(nav.querySelectorAll("a"));
    expect(links.map((a) => a.textContent)).toEqual(["Editori", "Sivut", "Blogi", "Analytiikka", "Asetukset"]);
    expect(links.find((a) => a.getAttribute("aria-current") === "page")?.textContent).toBe("Blogi");
    expect(getByRole("link", { name: "Avaa sivusto" }).getAttribute("href")).toBe("https://acme.fi");
  });
});
