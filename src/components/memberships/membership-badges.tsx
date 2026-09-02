import { cn } from "@/lib/utils";
import {
  EFFECTIVE_STATUS_CLASSES,
  EFFECTIVE_STATUS_LABELS,
  MEMBERSHIP_CATEGORY_SHORT,
  PAYMENT_STATUS_CLASSES,
  PAYMENT_STATUS_LABELS,
  type EffectiveStatus,
  type MembershipCategory,
  type PaymentStatus,
} from "@/lib/memberships/constants";

export function MembershipStatusBadge({
  status,
  className,
}: {
  status: EffectiveStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
        EFFECTIVE_STATUS_CLASSES[status],
        className,
      )}
    >
      {EFFECTIVE_STATUS_LABELS[status]}
    </span>
  );
}

export function CategoryChip({
  category,
}: {
  category: MembershipCategory;
}) {
  return (
    <span className="bg-muted text-muted-foreground inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs">
      {MEMBERSHIP_CATEGORY_SHORT[category]}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
        PAYMENT_STATUS_CLASSES[status],
      )}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </span>
  );
}
