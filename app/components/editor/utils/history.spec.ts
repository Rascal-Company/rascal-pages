import { describe, expect, test } from "vitest";
import {
  MAX_HISTORY,
  canRedo,
  canUndo,
  initHistory,
  pushPresent,
  redo,
  replacePresent,
  undo,
} from "./history";

describe(initHistory, () => {
  test("starts with the value as present and empty stacks", () => {
    expect(initHistory("a")).toEqual({ past: [], present: "a", future: [] });
  });
});

describe(pushPresent, () => {
  test("moves the old present to past and sets the new present", () => {
    expect(pushPresent(initHistory("a"), "b")).toEqual({
      past: ["a"],
      present: "b",
      future: [],
    });
  });

  test("clears the redo future when a new value is pushed", () => {
    const afterUndo = undo(pushPresent(initHistory("a"), "b"));
    expect(pushPresent(afterUndo, "c")).toEqual({
      past: ["a"],
      present: "c",
      future: [],
    });
  });

  test("is a no-op when the value is referentially unchanged", () => {
    const history = initHistory("a");
    expect(pushPresent(history, "a")).toBe(history);
  });

  test("caps the past stack at MAX_HISTORY entries", () => {
    let history = initHistory(0);
    for (let value = 1; value <= MAX_HISTORY + 10; value++) {
      history = pushPresent(history, value);
    }
    expect(history.past).toHaveLength(MAX_HISTORY);
    expect(history.present).toBe(MAX_HISTORY + 10);
    // 61 presents (0..60) became candidates; only the newest 50 are kept,
    // so the oldest retained past entry is 10.
    expect(history.past[0]).toBe(10);
  });
});

describe(replacePresent, () => {
  test("swaps the present without adding an undo step", () => {
    const history = pushPresent(initHistory("a"), "b");
    expect(replacePresent(history, "b2")).toEqual({
      past: ["a"],
      present: "b2",
      future: [],
    });
  });
});

describe(undo, () => {
  test("restores the previous present and keeps it redoable", () => {
    const history = pushPresent(initHistory("a"), "b");
    expect(undo(history)).toEqual({ past: [], present: "a", future: ["b"] });
  });

  test("returns the same history when there is nothing to undo", () => {
    const history = initHistory("a");
    expect(undo(history)).toBe(history);
  });
});

describe(redo, () => {
  test("reapplies the most recently undone value", () => {
    const history = undo(pushPresent(initHistory("a"), "b"));
    expect(redo(history)).toEqual({ past: ["a"], present: "b", future: [] });
  });

  test("returns the same history when there is nothing to redo", () => {
    const history = initHistory("a");
    expect(redo(history)).toBe(history);
  });
});

describe("undo/redo flags", () => {
  test("reflect availability of past and future", () => {
    const fresh = initHistory("a");
    expect([canUndo(fresh), canRedo(fresh)]).toEqual([false, false]);

    const edited = pushPresent(fresh, "b");
    expect([canUndo(edited), canRedo(edited)]).toEqual([true, false]);

    const undone = undo(edited);
    expect([canUndo(undone), canRedo(undone)]).toEqual([false, true]);
  });
});

describe("history round-trips", () => {
  test("undo after a distinct push returns the original present", () => {
    const original = { sections: [1] };
    const edited = pushPresent(initHistory(original), { sections: [1, 2] });
    expect(undo(edited).present).toBe(original);
  });

  test("redo reapplies the value removed by undo", () => {
    const edited = pushPresent(initHistory("a"), "b");
    expect(redo(undo(edited)).present).toBe(edited.present);
  });

  test("a sequence of edits unwinds in reverse order via undo", () => {
    const steps = ["a", "b", "c", "d"];
    let history = initHistory(steps[0]);
    for (const value of steps.slice(1)) {
      history = pushPresent(history, value);
    }

    const unwound: string[] = [history.present];
    while (canUndo(history)) {
      history = undo(history);
      unwound.push(history.present);
    }

    expect(unwound).toEqual(["d", "c", "b", "a"]);
  });
});
