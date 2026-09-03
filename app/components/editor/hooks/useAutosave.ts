"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

type SaveResult = { error?: string } | void;

type UseAutosaveOptions<T> = {
  data: T;
  onSave: (data: T) => Promise<SaveResult>;
  /** Debounce delay in ms before an autosave fires. */
  delay?: number;
  enabled?: boolean;
};

export type AutosaveControls = {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  /** True while `data` differs from the last persisted snapshot. */
  isDirty: boolean;
  /** Force an immediate save, bypassing the debounce. */
  saveNow: () => Promise<void>;
  /** Mark the given data as already persisted (e.g. after a manual save). */
  markSaved: (data: unknown) => void;
};

/**
 * Debounced autosave. Persists `data` after it stays unchanged for `delay` ms,
 * skipping saves when the serialized data matches the last saved snapshot.
 * The snapshot is kept both in a ref (read by the async save without a stale
 * closure) and in state (so `isDirty` re-renders when a save lands).
 */
export function useAutosave<T>({
  data,
  onSave,
  delay = 1500,
  enabled = true,
}: UseAutosaveOptions<T>): AutosaveControls {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() =>
    JSON.stringify(data),
  );

  const savedSnapshotRef = useRef<string>(savedSnapshot);
  const dataRef = useRef<T>(data);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    dataRef.current = data;
    onSaveRef.current = onSave;
  });

  const commitSnapshot = useCallback((snapshot: string) => {
    savedSnapshotRef.current = snapshot;
    setSavedSnapshot(snapshot);
    setLastSavedAt(new Date());
    setStatus("saved");
  }, []);

  const runSave = useCallback(async () => {
    const snapshot = JSON.stringify(dataRef.current);
    if (snapshot === savedSnapshotRef.current) return;

    setStatus("saving");
    try {
      const result = await onSaveRef.current(dataRef.current);
      if (result && result.error) {
        setStatus("error");
        return;
      }
      commitSnapshot(snapshot);
    } catch {
      setStatus("error");
    }
  }, [commitSnapshot]);

  const serialized = JSON.stringify(data);
  const isDirty = serialized !== savedSnapshot;

  useEffect(() => {
    if (!enabled || !isDirty) return;

    const timer = setTimeout(runSave, delay);
    return () => clearTimeout(timer);
  }, [serialized, isDirty, delay, enabled, runSave]);

  const saveNow = useCallback(async () => {
    await runSave();
  }, [runSave]);

  const markSaved = useCallback(
    (saved: unknown) => {
      commitSnapshot(JSON.stringify(saved));
    },
    [commitSnapshot],
  );

  return { status, lastSavedAt, isDirty, saveNow, markSaved };
}
