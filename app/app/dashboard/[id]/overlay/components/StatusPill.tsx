import { cn } from "@/src/lib/utils";

const TONES = {
  live: "bg-success/12 text-success ring-success/25",
  draft: "bg-muted text-muted-foreground ring-border",
  paused: "bg-warning/15 text-warning-foreground ring-warning/30 dark:text-warning",
  neutral: "bg-accent text-accent-foreground ring-border",
} as const;

/** Pieni tilamerkintä. `live` saa sykkivän pisteen, joka kertoo näkyvyydestä. */
export default function StatusPill({
  tone,
  children,
  className,
}: {
  tone: keyof typeof TONES;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {tone === "live" && (
        <span className="relative flex size-1.5" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex size-1.5 rounded-full bg-success" />
        </span>
      )}
      {children}
    </span>
  );
}
