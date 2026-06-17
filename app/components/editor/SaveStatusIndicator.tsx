"use client";

import type { AutosaveStatus } from "./hooks/useAutosave";

type SaveStatusIndicatorProps = {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString("fi-FI", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SaveStatusIndicator({
  status,
  lastSavedAt,
}: SaveStatusIndicatorProps) {
  if (status === "saving") {
    return <span className="text-xs text-gray-500">Tallennetaan…</span>;
  }

  if (status === "error") {
    return (
      <span className="text-xs text-red-600">
        Automaattitallennus epäonnistui
      </span>
    );
  }

  if (status === "saved" && lastSavedAt) {
    return (
      <span className="text-xs text-gray-500">
        Tallennettu klo {formatTime(lastSavedAt)}
      </span>
    );
  }

  return <span className="text-xs text-gray-400">Kaikki muutokset tallessa</span>;
}
