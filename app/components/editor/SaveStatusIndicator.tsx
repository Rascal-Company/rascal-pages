"use client";

import type { AutosaveStatus } from "./hooks/useAutosave";

type SaveStatusIndicatorProps = {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  isDirty: boolean;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("fi-FI", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Compact save state for the top bar: a dot whose colour carries the state and
 * a short label. Dirty-but-not-yet-saving is shown explicitly so the author
 * knows the debounce has not fired yet.
 */
export default function SaveStatusIndicator({
  status,
  lastSavedAt,
  isDirty,
}: SaveStatusIndicatorProps) {
  const view = (() => {
    if (status === "saving") {
      return { dot: "bg-primary animate-pulse", text: "Tallennetaan…" };
    }
    if (status === "error") {
      return { dot: "bg-destructive", text: "Tallennus epäonnistui" };
    }
    if (isDirty) {
      return { dot: "bg-amber-500", text: "Tallentamattomia muutoksia" };
    }
    if (status === "saved" && lastSavedAt) {
      return {
        dot: "bg-emerald-500",
        text: `Tallennettu klo ${formatTime(lastSavedAt)}`,
      };
    }
    return { dot: "bg-muted-foreground/50", text: "Kaikki tallessa" };
  })();

  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 text-xs ${
        status === "error" ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${view.dot}`} />
      {view.text}
    </span>
  );
}
