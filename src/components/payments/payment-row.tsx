import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentStatusBadge } from "@/components/memberships/membership-badges";
import { formatCurrency, formatDate } from "@/lib/dates";
import { PAYMENT_METHOD_LABELS } from "@/lib/memberships/constants";
import type { PaymentListItem } from "@/lib/memberships/queries";
import { DeletePaymentButton } from "./delete-payment";

/** One payment with its edit and delete controls. */
export function PaymentRow({
  payment,
  timeZone,
  showPerson = true,
}: {
  payment: PaymentListItem;
  timeZone: string;
  showPerson?: boolean;
}) {
  return (
    <div className="bg-card flex items-start justify-between gap-3 rounded-xl border px-4 py-3.5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold tabular-nums">
            {formatCurrency(payment.amount, payment.currency)}
          </span>
          <PaymentStatusBadge status={payment.status} />
        </div>

        {showPerson ? (
          <Link
            href={`/people/${payment.personId}`}
            className="hover:text-brand mt-1 block text-sm transition-colors"
          >
            {payment.personName}
          </Link>
        ) : null}

        <p className="text-muted-foreground mt-1 text-sm">
          {formatDate(payment.paymentDate, timeZone)} ·{" "}
          {PAYMENT_METHOD_LABELS[payment.method]}
        </p>

        {payment.membershipId && payment.membershipLabel ? (
          <Link
            href={`/memberships/${payment.membershipId}`}
            className="text-brand mt-0.5 inline-block text-xs hover:underline"
          >
            {payment.membershipLabel}
          </Link>
        ) : null}

        {payment.notes ? (
          <p className="text-muted-foreground/80 mt-1 text-xs text-pretty">
            {payment.notes}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 gap-1">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/payments/edit/${payment.id}`}>
            <Pencil className="size-4" />
            <span className="sr-only">Edit payment</span>
          </Link>
        </Button>
        <DeletePaymentButton
          paymentId={payment.id}
          personId={payment.personId}
          membershipId={payment.membershipId}
          amount={payment.amount}
          currency={payment.currency}
        />
      </div>
    </div>
  );
}
