// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import EditorRail from "./EditorRail";
import type { SiteId } from "@/src/lib/types";

describe("EditorRail", () => {
  it("paneelipainikkeet vaihtavat paneelia ja hallintalinkit avaavat ikkunan", () => {
    const onPanel = vi.fn();
    const { getByRole } = render(
      <EditorRail siteId={"s1" as SiteId} panelTab="sections" panelOpen onPanel={onPanel} />,
    );
    expect(getByRole("button", { name: "Osiot" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(getByRole("button", { name: "Tyyli" }));
    expect(onPanel).toHaveBeenCalledWith("style");
    expect(getByRole("link", { name: "Blogi" }).getAttribute("href")).toBe("/app/dashboard/s1/posts");
    expect(getByRole("link", { name: "Asetukset" }).getAttribute("href")).toBe("/app/dashboard/s1/settings");
  });
});
