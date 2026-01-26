"use client";

import { useState } from "react";
import type { SectionType } from "@/src/lib/templates";
import {
  SECTION_TYPE_LABELS,
  ADDABLE_SECTION_TYPES,
} from "@/src/lib/templates";

type AddSectionButtonProps = {
  onAdd: (type: SectionType) => void;
};

export default function AddSectionButton({ onAdd }: AddSectionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-3 text-sm font-medium text-gray-600 hover:border-brand-accent hover:text-brand-accent transition-colors"
      >
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
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
            <div className="grid grid-cols-2 gap-1">
              {ADDABLE_SECTION_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    onAdd(type);
                    setIsOpen(false);
                  }}
                  className="rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  {SECTION_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
