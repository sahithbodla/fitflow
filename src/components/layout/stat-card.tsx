import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Compact metric tile. `value` is always a real, computed number — pass 0 and a
 * helpful `emptyHint` rather than inventing placeholder figures.
 */
export type StatCardTone =
  | "default"
  | "brand"
  | "warning"
  | "danger"
  | "violet"
  | "teal"
  | "sky"
  | "emerald";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
  tone?: StatCardTone;
  className?: string;
}) {
  const toneClasses: Record<StatCardTone, string> = {
    default: "bg-muted text-muted-foreground",
    brand: "bg-brand-soft text-brand",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    danger: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  };

  return (
    <Card className={cn("h-full py-4", className)}>
      <CardContent className="flex h-full items-start gap-3 px-4">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg",
            toneClasses[tone],
          )}
          aria-hidden
        >
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-2xl leading-none font-semibold tabular-nums">
            {value}
          </p>
          <p className="text-muted-foreground mt-1.5 text-xs leading-snug">
            {label}
          </p>
          {hint ? (
            <p className="text-muted-foreground/80 mt-0.5 text-[11px] leading-snug">
              {hint}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
