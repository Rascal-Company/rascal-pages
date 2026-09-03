// @vitest-environment happy-dom
import { beforeEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import type { TemplateConfig } from "@/src/lib/templates";
import { createSection, getDefaultSectionContent } from "./utils/contentUtils";
import { createSiteId } from "@/src/lib/types";
import { ToastProvider } from "@/app/components/ui/ToastContainer";
import { DashboardThemeProvider } from "@/app/components/providers/DashboardThemeProvider";

type Persist = (
  siteId: string,
  content: unknown,
  published: boolean,
  pageSlug: string,
) => Promise<{ error?: string } | void>;

const { persist } = vi.hoisted(() => ({
  persist: vi.fn<Persist>(async () => undefined),
}));

vi.mock("@/app/actions/save-page", () => ({
  updatePageContent: persist,
}));

vi.mock("@/app/actions/pages", () => ({
  listSitePages: async () => [
    { slug: "home", title: "Etusivu" },
    { slug: "palvelut", title: "Palvelut" },
  ],
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import Editor from "./Editor";

function Providers({ children }: { children: ReactNode }) {
  return (
    <DashboardThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </DashboardThemeProvider>
  );
}

function buildContent(): TemplateConfig {
  const hero = createSection("hero", {
    ...getDefaultSectionContent("hero"),
    title: "Rakennamme kestävää",
  });
  const faq = createSection("faq", [
    { question: "Mitä maksaa?", answer: "Riippuu." },
    { question: "Kuinka nopeasti?", answer: "Viikossa." },
  ]);
  return {
    templateId: "saas-modern",
    theme: { primaryColor: "#3B82F6" },
    sections: [hero, faq],
  };
}

function renderEditor(overrides: Partial<Parameters<typeof Editor>[0]> = {}) {
  return render(
    <Providers>
      <Editor
        siteId={createSiteId("11111111-1111-4111-8111-111111111111")}
        pageId="page-1"
        siteSubdomain="testi"
        initialContent={buildContent()}
        crmEnabled={false}
        {...overrides}
      />
    </Providers>,
  );
}

beforeEach(() => {
  persist.mockClear();
  window.CSS = { escape: (s: string) => s } as unknown as typeof CSS;
});

describe("Editor", () => {
  test("opens without a selected section and lists sections with summaries", () => {
    renderEditor();
    const list = screen.getByRole("tabpanel");
    expect(within(list).getByText("Rakennamme kestävää")).toBeTruthy();
    expect(within(list).getByText("Mitä maksaa? +1")).toBeTruthy();
    expect(screen.queryByRole("dialog", { name: /Muokkaa osiota/ })).toBeNull();
  });

  test("selecting a section from the list opens the floating editor on Sisältö", () => {
    renderEditor();
    fireEvent.click(screen.getByText("Mitä maksaa? +1"));
    const dialog = screen.getByRole("dialog", { name: "Muokkaa osiota: UKK" });
    expect(
      within(dialog).getByRole("tab", { name: "Sisältö", selected: true }),
    ).toBeTruthy();
  });

  test("Backspace removes the selected section and Kumoa brings it back", () => {
    renderEditor();
    fireEvent.click(screen.getByText("Mitä maksaa? +1"));
    fireEvent.keyDown(window, { key: "Backspace" });

    const list = screen.getByRole("tabpanel");
    expect(within(list).queryByText("Mitä maksaa? +1")).toBeNull();
    const toast = screen.getByText("UKK poistettu").closest("[role=status]");
    expect(toast).not.toBeNull();

    fireEvent.click(
      within(toast as HTMLElement).getByRole("button", { name: "Kumoa" }),
    );
    expect(within(list).getByText("Mitä maksaa? +1")).toBeTruthy();
  });

  test("shortcuts that edit sections do not fire while typing in a field", () => {
    renderEditor();
    fireEvent.click(screen.getByText("Mitä maksaa? +1"));
    const input = screen.getAllByRole("textbox")[0];
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(screen.queryByText("UKK poistettu")).toBeNull();
  });

  test("publishing asks for confirmation and persists the published flag", async () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Julkaise" }));
    expect(screen.getByText(/Julkaistaanko sivu/)).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Vahvista" }));
    });

    expect(persist).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ templateId: "saas-modern" }),
      true,
      "home",
    );
    expect(screen.getByText("Julkaistu")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Piilota sivu" })).toBeTruthy();
  });

  test("Ulkoasu tab holds the template selector so it is not the first thing on screen", () => {
    renderEditor();
    expect(screen.queryByText("Template")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Ulkoasu" }));
    expect(screen.getByText("Template")).toBeTruthy();
  });

  test("removing the last section shows the empty state with an add button", () => {
    renderEditor({
      initialContent: {
        templateId: "saas-modern",
        theme: { primaryColor: "#3B82F6" },
        sections: [
          createSection("cta", {
            ...getDefaultSectionContent("cta"),
            heading: "Ainoa osio",
          }),
        ],
      },
    });
    fireEvent.click(
      within(screen.getByRole("tabpanel")).getByText("Ainoa osio"),
    );
    fireEvent.keyDown(window, { key: "Delete" });
    const emptyState = screen.getByText("Sivu on tyhjä").closest("div");
    expect(emptyState).not.toBeNull();
    fireEvent.click(
      within(emptyState as HTMLElement).getByRole("button", {
        name: "Lisää osio",
      }),
    );
    expect(screen.getByRole("dialog", { name: "Lisää osio" })).toBeTruthy();
  });
});
