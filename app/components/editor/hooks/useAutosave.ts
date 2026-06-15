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
  /** Force an immediate save, bypassing the debounce. */
  saveNow: () => Promise<void>;
  /** Mark the given data as already persisted (e.g. after a manual save). */
  markSaved: (data: unknown) => void;
};

/**
 * Debounced autosave. Persists `data` after it stays unchanged for `delay` ms,
 * skipping saves when the serialized data matches the last saved snapshot.
 */
export function useAutosave<T>({
  data,
  onSave,
  delay = 1500,
  enabled = true,
}: UseAutosaveOptions<T>): AutosaveControls {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const savedSnapshotRef = useRef<string>(JSON.stringify(data));
  const dataRef = useRef<T>(data);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    dataRef.current = data;
    onSaveRef.current = onSave;
  });

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
      savedSnapshotRef.current = snapshot;
      setLastSavedAt(new Date());
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (JSON.stringify(data) === savedSnapshotRef.current) return;

    const timer = setTimeout(runSave, delay);
    return () => clearTimeout(timer);
  }, [data, delay, enabled, runSave]);

  const saveNow = useCallback(async () => {
    await runSave();
  }, [runSave]);

  const markSaved = useCallback((saved: unknown) => {
    savedSnapshotRef.current = JSON.stringify(saved);
    setLastSavedAt(new Date());
    setStatus("saved");
  }, []);

  return { status, lastSavedAt, saveNow, markSaved };
}
