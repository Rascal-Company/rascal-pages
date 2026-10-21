import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";

/** Yksi tunnusluku ja sen muutos edelliseen jaksoon. */
export default function KpiTile({
  icon: Icon,
  label,
  value,
  change,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: number | null;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 h-4 text-xs text-muted-foreground">
        {change !== undefined && change !== null ? <Change value={change} /> : hint}
      </p>
    </div>
  );
}

export function Change({ value, compact = false }: { value: number; compact?: boolean }) {
  const up = value > 0;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium tabular-nums",
        value === 0 ? "text-muted-foreground" : up ? "text-success" : "text-destructive",
      )}
      title="Muutos edelliseen 30 päivään"
    >
      {value !== 0 && <Arrow className="size-3" aria-hidden />}
      {value > 0 ? "+" : ""}
      {value} %
      {!compact && <span className="ml-1 font-normal text-muted-foreground">vs. ed. 30 pv</span>}
    </span>
  );
}
