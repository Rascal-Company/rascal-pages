"use client";

import type { SectionType } from "@/src/lib/templates";
import {
  ADDABLE_SECTION_TYPES,
  SECTION_TYPE_DESCRIPTIONS,
  SECTION_TYPE_LABELS,
} from "@/src/lib/templates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

type SectionPickerProps = {
  open: boolean;
  onClose: () => void;
  onPick: (type: SectionType) => void;
};

export default function SectionPicker({
  open,
  onClose,
  onPick,
}: SectionPickerProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Lisää osio</DialogTitle>
        </DialogHeader>
        <div className="grid max-h-[70vh] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {ADDABLE_SECTION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onPick(type)}
              className="flex flex-col items-start gap-0.5 rounded-md border border-border px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-accent focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="text-sm font-medium text-foreground">
                {SECTION_TYPE_LABELS[type]}
              </span>
              <span className="text-xs text-muted-foreground">
                {SECTION_TYPE_DESCRIPTIONS[type]}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
