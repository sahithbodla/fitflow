import {
  CalendarClock,
  CalendarX,
  MessageSquare,
  Pencil,
  Sparkles,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { formatDate } from "@/lib/dates";
import type { ActivityType } from "@/lib/leads/constants";
import type { LeadActivityItem } from "@/lib/leads/queries";

const ICONS: Record<ActivityType, LucideIcon> = {
  created: UserPlus,
  note: MessageSquare,
  status_change: Sparkles,
  follow_up_set: CalendarClock,
  follow_up_cleared: CalendarX,
  details_updated: Pencil,
  converted: Sparkles,
};

function timeOfDay(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

/** Reverse-chronological history of everything that happened to this lead. */
export function ActivityTimeline({
  activity,
  timeZone,
}: {
  activity: LeadActivityItem[];
  timeZone: string;
}) {
  if (activity.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-sm">
        Nothing recorded yet.
      </p>
    );
  }

  return (
    <ol className="space-y-0">
      {activity.map((entry, index) => {
        const Icon = ICONS[entry.type] ?? MessageSquare;
        const isNote = entry.type === "note";
        const isLast = index === activity.length - 1;

        return (
          <li key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className="bg-muted text-muted-foreground grid size-7 shrink-0 place-items-center rounded-full"
                aria-hidden
              >
                <Icon className="size-3.5" />
              </span>
              {!isLast ? <span className="bg-border w-px flex-1" /> : null}
            </div>

            <div className={isLast ? "min-w-0 pb-1" : "min-w-0 pb-5"}>
              <p
                className={
                  isNote
                    ? "text-sm whitespace-pre-wrap"
                    : "text-muted-foreground text-sm"
                }
              >
                {entry.message}
              </p>
              <p className="text-muted-foreground/80 mt-1 text-xs">
                {entry.actor} · {formatDate(entry.createdAt, timeZone)} at{" "}
                {timeOfDay(entry.createdAt, timeZone)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
