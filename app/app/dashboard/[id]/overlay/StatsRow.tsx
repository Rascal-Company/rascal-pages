import { Eye, Target, UsersRound } from "lucide-react";
import type { VariantStats } from "./overlay-data";

export function conversionRate(stats: VariantStats): string {
  if (stats.visitors === 0) return "0,0 %";
  return `${((stats.convertedVisitors / stats.visitors) * 100).toFixed(1).replace(".", ",")} %`;
}

/** Kävijät, näytöt ja konversio. `compact` = yhdelle riville variaatiolistaan. */
export default function StatsRow({
  stats,
  compact = false,
}: {
  stats: VariantStats;
  compact?: boolean;
}) {
  const items = [
    { icon: UsersRound, value: stats.visitors.toString(), label: "Kävijät" },
    { icon: Eye, value: stats.views.toString(), label: "Näytöt" },
    { icon: Target, value: conversionRate(stats), label: "Konversio" },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm text-brand-dark/80">
        {items.map(({ icon: Icon, value, label }) => (
          <span key={label} className="inline-flex items-center gap-1" title={label}>
            <Icon className="size-4 text-brand-dark/50" aria-hidden />
            {value}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 rounded-md bg-brand-light p-4">
      {items.map(({ icon: Icon, value, label }) => (
        <div key={label}>
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-primary" aria-hidden />
            <span className="text-xl font-semibold text-brand-dark">{value}</span>
          </div>
          <p className="mt-1 text-xs text-brand-dark/60">{label}</p>
        </div>
      ))}
    </div>
  );
}
