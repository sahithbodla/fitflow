import { cn } from "@/lib/utils";
import {
  CONVERSION_TYPE_SHORT,
  COACHING_STATUS_CLASSES,
  COACHING_STATUS_LABELS,
  type CoachingStatus,
  type ConversionType,
} from "@/lib/people/constants";

const TYPE_CLASSES: Record<ConversionType, string> = {
  gym_member: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  pt_client:
    "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  online_coaching:
    "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
};

export function PersonTypeChip({
  type,
  className,
}: {
  type: ConversionType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
        TYPE_CLASSES[type],
        className,
      )}
    >
      {CONVERSION_TYPE_SHORT[type]}
    </span>
  );
}

export function CoachingStatusBadge({ status }: { status: CoachingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
        COACHING_STATUS_CLASSES[status],
      )}
    >
      {COACHING_STATUS_LABELS[status]}
    </span>
  );
}
