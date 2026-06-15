"use client";

import type { SectionType } from "@/src/lib/templates";
import { ADDABLE_SECTION_TYPES, SECTION_TYPE_LABELS } from "@/src/lib/templates";
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lisää osio</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ADDABLE_SECTION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onPick(type)}
              className="rounded-md border border-border px-3 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-accent"
            >
              {SECTION_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
