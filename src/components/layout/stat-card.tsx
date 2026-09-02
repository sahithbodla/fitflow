import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Compact metric tile. `value` is always a real, computed number — pass 0 and a
 * helpful `emptyHint` rather than inventing placeholder figures.
 */
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
  tone?: "default" | "brand" | "warning" | "danger";
  className?: string;
}) {
  const toneClasses = {
    default: "bg-muted text-muted-foreground",
    brand: "bg-brand-soft text-brand",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    danger: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  }[tone];

  return (
    <Card className={cn("py-4", className)}>
      <CardContent className="flex items-start gap-3 px-4">
        <span
          className={cn("grid size-9 shrink-0 place-items-center rounded-lg", toneClasses)}
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
