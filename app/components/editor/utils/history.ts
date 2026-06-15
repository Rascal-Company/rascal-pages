/**
 * Pure undo/redo history model. Holds a `present` value plus `past` and
 * `future` stacks. All operations are immutable and return a new History.
 */

export type History<T> = {
  past: T[];
  present: T;
  future: T[];
};

/** Maximum number of past entries retained; older edits are dropped. */
export const MAX_HISTORY = 50;

export function initHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

/**
 * Record a new present value, pushing the previous one onto the past stack and
 * discarding any redo future. No-op when the value is referentially unchanged.
 */
export function pushPresent<T>(history: History<T>, next: T): History<T> {
  if (next === history.present) return history;

  const past = [...history.past, history.present];
  const trimmed =
    past.length > MAX_HISTORY ? past.slice(past.length - MAX_HISTORY) : past;

  return { past: trimmed, present: next, future: [] };
}

/**
 * Replace the present value without creating a new undo step. Used to coalesce
 * rapid consecutive edits (e.g. typing) into a single history entry.
 */
export function replacePresent<T>(history: History<T>, next: T): History<T> {
  if (next === history.present) return history;
  return { ...history, present: next, future: [] };
}

export function undo<T>(history: History<T>): History<T> {
  if (history.past.length === 0) return history;

  const previous = history.past[history.past.length - 1];
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo<T>(history: History<T>): History<T> {
  if (history.future.length === 0) return history;

  const [next, ...future] = history.future;
  return {
    past: [...history.past, history.present],
    present: next,
    future,
  };
}

export function canUndo<T>(history: History<T>): boolean {
  return history.past.length > 0;
}

export function canRedo<T>(history: History<T>): boolean {
  return history.future.length > 0;
}
