"use client";

import { Button } from "@/app/components/ui/button";

interface SaveButtonProps {
  isSaving: boolean;
  onSave: () => void;
}

export default function SaveButton({ isSaving, onSave }: SaveButtonProps) {
  return (
    <div className="sticky bottom-0 bg-background pt-4">
      <Button
        onClick={onSave}
        disabled={isSaving}
        size="lg"
        className="w-full"
      >
        {isSaving ? "Tallennetaan..." : "Tallenna muutokset"}
      </Button>
    </div>
  );
}
