import { Eye, Target, UsersRound } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { VariantStats } from "./overlay-data";

export function conversionRate(stats: VariantStats): string {
  if (stats.visitors === 0) return "0,0 %";
  return `${((stats.convertedVisitors / stats.visitors) * 100).toFixed(1).replace(".", ",")} %`;
}

const NUMBER = new Intl.NumberFormat("fi-FI");

/** Kävijät, näytöt ja konversio. `compact` = yhdelle riville variaatiolistaan. */
export default function StatsRow({
  stats,
  compact = false,
  className,
}: {
  stats: VariantStats;
  compact?: boolean;
  className?: string;
}) {
  const items = [
    { icon: UsersRound, value: NUMBER.format(stats.visitors), label: "Kävijät" },
    { icon: Eye, value: NUMBER.format(stats.views), label: "Näytöt" },
    { icon: Target, value: conversionRate(stats), label: "Konversio" },
  ];

  if (compact) {
    return (
      <dl className={cn("flex items-center gap-4 text-sm tabular-nums", className)}>
        {items.map(({ icon: Icon, value, label }) => (
          <div key={label} className="inline-flex items-center gap-1.5" title={label}>
            <dt>
              <Icon className="size-3.5 text-muted-foreground" aria-hidden />
              <span className="sr-only">{label}</span>
            </dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className={cn("grid grid-cols-3 divide-x divide-border rounded-xl bg-muted/60", className)}>
      {items.map(({ icon: Icon, value, label }) => (
        <div key={label} className="px-4 py-3">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="size-3.5" aria-hidden />
            {label}
          </dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums tracking-tight">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
