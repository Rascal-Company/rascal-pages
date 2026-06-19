"use client";

import { useState } from "react";
import { useSitePages } from "../SitePagesContext";

type LinkFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const inputClass =
  "block w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm";

/** Map a page slug to its public path. */
function pageHref(slug: string): string {
  return slug === "home" ? "/" : `/${slug}`;
}

/**
 * URL input with a built-in picker for the site's own pages, so authors can
 * link a CTA to a subpage (or the blog) without knowing its slug. Free-text
 * entry still works for external URLs and anchors.
 */
export default function LinkField({
  value,
  onChange,
  placeholder = "#tai https://...",
}: LinkFieldProps) {
  const pages = useSitePages();
  const [open, setOpen] = useState(false);

  const targets = [
    ...pages.map((page) => ({ label: page.title, href: pageHref(page.slug) })),
    { label: "Blogi", href: "/blog" },
  ];

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Valitse sivu"
          aria-expanded={open}
          className="shrink-0 rounded-md border border-input px-2.5 text-sm text-foreground hover:bg-accent"
        >
          Sivut ▾
        </button>
      </div>

      {open && (
        <div className="absolute right-0 z-20 mt-1 max-h-60 w-56 overflow-y-auto rounded-md border border-border bg-card p-1 shadow-lg">
          {targets.map((target) => (
            <button
              key={target.href}
              type="button"
              onClick={() => {
                onChange(target.href);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-accent"
            >
              <span className="truncate">{target.label}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {target.href}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
