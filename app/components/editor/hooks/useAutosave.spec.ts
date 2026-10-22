// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAutosave } from "./useAutosave";

describe("useAutosave", () => {
  it("tallentaa odottavan muutoksen heti, kun editori suljetaan", () => {
    vi.useFakeTimers();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender, unmount } = renderHook(({ data }) => useAutosave({ data, onSave, delay: 1500 }), {
      initialProps: { data: { title: "a" } },
    });
    rerender({ data: { title: "b" } });
    expect(onSave).not.toHaveBeenCalled();
    unmount();
    expect(onSave).toHaveBeenCalledWith({ title: "b" });
    vi.useRealTimers();
  });

  it("ei tallenna suljettaessa, jos muutoksia ei ole", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { unmount } = renderHook(() => useAutosave({ data: { title: "a" }, onSave }));
    unmount();
    expect(onSave).not.toHaveBeenCalled();
  });
});
