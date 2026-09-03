"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { SHORTCUT_HELP } from "./utils/shortcuts";

type ShortcutHelpDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function ShortcutHelpDialog({
  open,
  onClose,
}: ShortcutHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pikanäppäimet</DialogTitle>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
          {SHORTCUT_HELP.map((item) => (
            <div key={item.keys} className="contents">
              <dt>
                <kbd className="inline-block rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                  {item.keys}
                </kbd>
              </dt>
              <dd className="text-foreground">{item.label}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-muted-foreground">
          Windowsilla ⌘ on Ctrl ja ⌥ on Alt. Osioiden pikanäppäimet eivät
          laukea, kun kirjoitat tekstikenttään.
        </p>
      </DialogContent>
    </Dialog>
  );
}
