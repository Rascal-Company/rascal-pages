"use client";

import { Switch } from "@/app/components/ui/switch";

interface PublishedToggleProps {
  published: boolean;
  onToggle: (published: boolean) => void;
  isSaving?: boolean;
}

export default function PublishedToggle({
  published,
  onToggle,
  isSaving = false,
}: PublishedToggleProps) {
  return (
    <div className="rounded-lg border border-border p-4 bg-muted">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Julkaisutila</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {published
              ? "Sivu on julkinen ja näkyy kävijöille"
              : "Sivu on piilossa ja näkyy vain sinulle"}
          </p>
        </div>
        <Switch
          checked={published}
          onCheckedChange={onToggle}
          disabled={isSaving}
          aria-label={published ? "Piilota sivu" : "Julkaise sivu"}
        />
      </div>
    </div>
  );
}
