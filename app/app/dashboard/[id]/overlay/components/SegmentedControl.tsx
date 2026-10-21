"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/src/lib/utils";

type Option<T extends string> = { value: T; label: React.ReactNode; title?: string };

/**
 * Segmentoitu valitsin, jonka korostus liukuu valitun kohdan alle.
 * Näppäimistö: nuolinäppäimet siirtävät valintaa.
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
  ariaLabel,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
  ariaLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const active = container?.querySelector<HTMLElement>(`[data-value="${value}"]`);
    if (!container || !active) return;
    const update = () => setIndicator({ left: active.offsetLeft, width: active.offsetWidth });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [value, options.length]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const index = options.findIndex((o) => o.value === value);
    const next = (index + (e.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
    onChange(options[next].value);
    containerRef.current
      ?.querySelector<HTMLElement>(`[data-value="${options[next].value}"]`)
      ?.focus();
  }

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative flex rounded-lg bg-muted p-0.5",
        size === "sm" ? "text-xs" : "text-sm",
        className,
      )}
    >
      {indicator && (
        <span
          aria-hidden
          className="absolute inset-y-0.5 rounded-md bg-card shadow-sm ring-1 ring-border transition-[transform,width] duration-200 ease-out motion-reduce:transition-none"
          style={{ width: indicator.width, transform: `translateX(${indicator.left - 2}px)`, left: 2 }}
        />
      )}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            data-value={option.value}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              size === "sm" ? "h-7 px-2.5" : "h-8 px-3",
              selected ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
