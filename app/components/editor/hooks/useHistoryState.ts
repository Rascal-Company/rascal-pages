"use client";

import { useCallback, useRef, useState } from "react";
import {
  canRedo,
  canUndo,
  initHistory,
  pushPresent,
  redo as redoHistory,
  replacePresent,
  undo as undoHistory,
  type History,
} from "../utils/history";

/**
 * Consecutive edits within this window are coalesced into a single undo step,
 * so typing a word is one undo rather than one-per-keystroke.
 */
const COALESCE_MS = 600;

type Updater<T> = T | ((prev: T) => T);

function applyUpdater<T>(updater: Updater<T>, prev: T): T {
  return typeof updater === "function"
    ? (updater as (prev: T) => T)(prev)
    : updater;
}

export type HistoryState<T> = {
  state: T;
  set: (updater: Updater<T>) => void;
  undo: () => void;
  redo: () => void;
  reset: (value: T) => void;
  canUndo: boolean;
  canRedo: boolean;
};

/**
 * `useState`-like hook with undo/redo. `set` accepts a value or updater exactly
 * like `setState`; rapid changes are coalesced into one history entry.
 */
export function useHistoryState<T>(initial: T): HistoryState<T> {
  const [history, setHistory] = useState<History<T>>(() =>
    initHistory(initial),
  );
  const lastChangeRef = useRef(0);

  const set = useCallback((updater: Updater<T>) => {
    const now = Date.now();
    const coalesce = now - lastChangeRef.current < COALESCE_MS;
    lastChangeRef.current = now;

    setHistory((current) => {
      const next = applyUpdater(updater, current.present);
      return coalesce
        ? replacePresent(current, next)
        : pushPresent(current, next);
    });
  }, []);

  const undo = useCallback(() => {
    lastChangeRef.current = 0;
    setHistory((current) => undoHistory(current));
  }, []);

  const redo = useCallback(() => {
    lastChangeRef.current = 0;
    setHistory((current) => redoHistory(current));
  }, []);

  const reset = useCallback((value: T) => {
    lastChangeRef.current = 0;
    setHistory(initHistory(value));
  }, []);

  return {
    state: history.present,
    set,
    undo,
    redo,
    reset,
    canUndo: canUndo(history),
    canRedo: canRedo(history),
  };
}
