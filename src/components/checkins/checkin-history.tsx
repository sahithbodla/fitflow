import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dates";
import {
  ADHERENCE_CLASSES,
  ADHERENCE_LABELS,
  type AdherenceLevel,
} from "@/lib/checkins/constants";
import type { CheckInView } from "@/lib/checkins/queries";
import { ArchiveCheckInButton } from "./archive-checkin";

function AdherenceBadge({
  label,
  value,
}: {
  label: string;
  value: AdherenceLevel | "";
}) {
  if (!value) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
        ADHERENCE_CLASSES[value],
      )}
    >
      {label}: {ADHERENCE_LABELS[value]}
    </span>
  );
}

/**
 * Full check-in history — also the table view that accompanies the weight
 * chart, so every reading is readable as text.
 */
export function CheckInHistory({
  checkIns,
  clientId,
  timeZone,
}: {
  checkIns: CheckInView[];
  clientId: string;
  timeZone: string;
}) {
  return (
    <ul className="space-y-2.5">
      {checkIns.map((checkIn) => (
        <li
          key={checkIn.id}
          className="bg-card rounded-xl border px-4 py-3.5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="font-medium">
                  {formatDate(checkIn.checkInDate, timeZone)}
                </p>

                {checkIn.weight !== null ? (
                  <span className="text-sm">
                    {checkIn.weight}
                    {checkIn.weightUnit}
                    {checkIn.weightChange !== null &&
                    checkIn.weightChange !== 0 ? (
                      <span
                        className={cn(
                          "ml-1.5 text-xs font-medium",
                          checkIn.weightChange < 0
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-amber-700 dark:text-amber-400",
                        )}
                      >
                        {checkIn.weightChange > 0 ? "+" : ""}
                        {checkIn.weightChange}
                        {checkIn.weightUnit}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    No weight recorded
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <AdherenceBadge label="Diet" value={checkIn.dietAdherence} />
                <AdherenceBadge
                  label="Workouts"
                  value={checkIn.workoutAdherence}
                />
              </div>

              {checkIn.questions ? (
                <div className="mt-2.5">
                  <p className="text-muted-foreground text-xs">They asked</p>
                  <p className="mt-0.5 text-sm whitespace-pre-wrap">
                    {checkIn.questions}
                  </p>
                </div>
              ) : null}

              {checkIn.coachNotes ? (
                <div className="mt-2.5">
                  <p className="text-muted-foreground text-xs">Your notes</p>
                  <p className="mt-0.5 text-sm whitespace-pre-wrap">
                    {checkIn.coachNotes}
                  </p>
                </div>
              ) : null}

              {checkIn.recordedBy ? (
                <p className="text-muted-foreground/80 mt-2 text-xs">
                  Recorded by {checkIn.recordedBy}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 gap-1">
              <Button asChild variant="ghost" size="sm">
                <Link
                  href={`/coaching/${clientId}/check-ins/${checkIn.id}/edit`}
                >
                  <Pencil className="size-4" />
                  <span className="sr-only">
                    Edit check-in from{" "}
                    {formatDate(checkIn.checkInDate, timeZone)}
                  </span>
                </Link>
              </Button>
              <ArchiveCheckInButton
                checkInId={checkIn.id}
                clientId={clientId}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
