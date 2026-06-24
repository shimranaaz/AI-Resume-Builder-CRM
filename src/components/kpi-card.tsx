import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: string | number;
  icon: string;
  tone?: "default" | "primary" | "success" | "warning" | "info";
  hint?: string;
}) {
const toneClass = "bg-primary-soft text-primary";
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_30px_-12px_color-mix(in_oklab,var(--primary)_25%,transparent)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-transform group-hover:scale-110",
            toneClass,
          )}
        >
          <i className={`${icon} text-base`} />
        </div>
      </div>
    </div>
  );
}
