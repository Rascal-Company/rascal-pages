"use client";

import type { SectionType } from "@/src/lib/templates";
import {
  SECTION_TYPE_LABELS,
  ADDABLE_SECTION_TYPES,
} from "@/src/lib/templates";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/app/components/ui/dropdown-menu";

type AddSectionButtonProps = {
  onAdd: (type: SectionType) => void;
};

export default function AddSectionButton({ onAdd }: AddSectionButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input p-3 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors">
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Lisää osio
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[var(--radix-dropdown-menu-trigger-width)]"
      >
        <div className="grid grid-cols-2 gap-1">
          {ADDABLE_SECTION_TYPES.map((type) => (
            <DropdownMenuItem
              key={type}
              onSelect={() => onAdd(type)}
              className="text-foreground"
            >
              {SECTION_TYPE_LABELS[type]}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
