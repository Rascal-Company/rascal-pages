// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import SiteModal from "./SiteModal";

const back = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back }),
  useParams: () => ({ id: "s1" }),
}));

describe("SiteModal", () => {
  it("näyttää hallinnan näkymät, nykyisen näkymän ja sisällön", () => {
    const { getByRole } = render(
      <SiteModal active="posts">
        <p>Blogin sisältö</p>
      </SiteModal>,
    );
    const nav = getByRole("navigation", { name: "Sivuston hallinta" });
    const links = Array.from(nav.querySelectorAll("a"));
    expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
      ["Sivut", "/app/dashboard/s1/pages"],
      ["Blogi", "/app/dashboard/s1/posts"],
      ["Analytiikka", "/app/dashboard/s1/analytics"],
      ["Asetukset", "/app/dashboard/s1/settings"],
    ]);
    expect(links[1].getAttribute("aria-current")).toBe("page");
    expect(getByRole("dialog").textContent).toContain("Blogin sisältö");
  });

  it("sulkeminen palaa editoriin", () => {
    const { getByRole } = render(<SiteModal active="settings" />);
    fireEvent.click(getByRole("button", { name: "Sulje (Esc)" }));
    expect(back).toHaveBeenCalled();
  });
});
