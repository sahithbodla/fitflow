"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { ConfirmSubmit } from "@/components/form/confirm-submit";
import { deletePaymentAction } from "@/lib/actions/memberships";
import { idleFormState } from "@/lib/actions/types";
import { formatCurrency } from "@/lib/dates";

export function DeletePaymentButton({
  paymentId,
  personId,
  membershipId,
  amount,
  currency,
}: {
  paymentId: string;
  personId: string;
  membershipId?: string | null;
  amount: number;
  currency: string;
}) {
  const [state, formAction] = useActionState(
    deletePaymentAction,
    idleFormState,
  );

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="paymentId" value={paymentId} />
      <input type="hidden" name="personId" value={personId} />
      {membershipId ? (
        <input type="hidden" name="membershipId" value={membershipId} />
      ) : null}
      <ConfirmSubmit
        variant="ghost"
        size="sm"
        destructive
        className="text-muted-foreground hover:text-destructive"
        title="Delete this payment?"
        description={`The ${formatCurrency(amount, currency)} record will no longer appear anywhere, including your payment totals.`}
        confirmLabel="Delete payment"
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Delete payment</span>
      </ConfirmSubmit>
    </form>
  );
}
