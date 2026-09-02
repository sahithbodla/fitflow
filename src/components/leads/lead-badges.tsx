import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { daysUntil, relativeDayLabel } from "@/lib/dates";
import {
  LEAD_INTEREST_SHORT,
  LEAD_STATUS_CLASSES,
  LEAD_STATUS_LABELS,
  type LeadInterest,
  type LeadStatus,
} from "@/lib/leads/constants";

export function LeadStatusBadge({
  status,
  className,
}: {
  status: LeadStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
        LEAD_STATUS_CLASSES[status],
        className,
      )}
    >
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}

export function LeadInterestChip({ interest }: { interest: LeadInterest }) {
  return (
    <span className="bg-muted text-muted-foreground inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs">
      {LEAD_INTEREST_SHORT[interest]}
    </span>
  );
}

/**
 * Follow-up indicator. Overdue is red, today is amber, future is muted — so a
 * glance down the list shows what needs chasing without reading dates.
 */
export function FollowUpBadge({
  date,
  timeZone,
  className,
}: {
  date: string | null;
  timeZone: string;
  className?: string;
}) {
  if (!date) return null;

  const diff = daysUntil(date, timeZone);
  const tone =
    diff < 0
      ? "text-red-700 dark:text-red-400"
      : diff === 0
        ? "text-amber-700 dark:text-amber-400"
        : "text-muted-foreground";

  return (
    <span
      className={cn("inline-flex items-center gap-1 text-xs", tone, className)}
    >
      <CalendarClock className="size-3.5 shrink-0" aria-hidden />
      {diff < 0 ? "Overdue · " : ""}
      {relativeDayLabel(date, timeZone)}
    </span>
  );
}
