"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form/field";
import { FormAlert } from "@/components/form/form-alert";
import { cn } from "@/lib/utils";
import {
  recordPaymentAction,
  updatePaymentAction,
} from "@/lib/actions/memberships";
import { idleFormState } from "@/lib/actions/types";
import { useFormErrors } from "@/components/form/use-form-errors";
import { ConfirmSubmit } from "@/components/form/confirm-submit";
import { Field as FormField } from "@/components/form/field";
import { cn as classNames } from "@/lib/utils";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/memberships/constants";

/** Manual payment entry. There is no gateway — this records money already taken. */
export function PaymentForm({
  paymentId,
  personId,
  membershipId,
  membershipOptions,
  currency,
  today,
  defaultAmount,
  defaults,
  submitLabel = "Record payment",
}: {
  /** Null creates a payment; an id updates that one. */
  paymentId?: string | null;
  personId: string;
  membershipId?: string;
  /** Offered when the payment is not already tied to one membership. */
  membershipOptions?: { id: string; label: string }[];
  currency: string;
  today: string;
  defaultAmount?: string;
  defaults?: {
    amount: string;
    paymentDate: string;
    method: PaymentMethod;
    status: PaymentStatus;
    notes: string;
    membershipId: string;
  };
  submitLabel?: string;
}) {
  const action = paymentId
    ? updatePaymentAction.bind(null, paymentId)
    : recordPaymentAction;
  const [state, formAction] = useActionState(action, idleFormState);
  const [method, setMethod] = useState<PaymentMethod>(
    defaults?.method ?? "cash",
  );
  const [status, setStatus] = useState<PaymentStatus>(
    defaults?.status ?? "paid",
  );
  const [linkedMembership, setLinkedMembership] = useState(
    defaults?.membershipId ?? membershipId ?? "",
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Only the inline "record another" form resets; the edit page navigates
    // away on success.
    if (state.status === "success" && !paymentId) {
      formRef.current?.reset();
      if (state.message) toast.success(state.message);
    }
  }, [state, paymentId]);

  const { errors, handleInput, alertState } = useFormErrors(state);

  return (
    <form
      action={formAction}
      ref={formRef}
      onInput={handleInput}
      className="space-y-4"
      noValidate
    >
      <input type="hidden" name="personId" value={personId} />
      <input type="hidden" name="membershipId" value={linkedMembership} />
      <input type="hidden" name="method" value={method} />
      <input type="hidden" name="status" value={status} />

      <FormAlert state={alertState} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="amount"
          label={`Amount (${currency})`}
          error={errors.amount}
          required
        >
          <Input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            required
            defaultValue={defaults?.amount ?? defaultAmount ?? ""}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={errors.amount ? "amount-error" : undefined}
          />
        </Field>

        <Field
          id="paymentDate"
          label="Payment date"
          error={errors.paymentDate}
          required
        >
          <Input
            id="paymentDate"
            name="paymentDate"
            type="date"
            defaultValue={defaults?.paymentDate ?? today}
            required
            aria-invalid={Boolean(errors.paymentDate)}
            aria-describedby={
              errors.paymentDate ? "paymentDate-error" : undefined
            }
          />
        </Field>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm leading-none font-medium">Method</legend>
        <div className="flex flex-wrap gap-2 pt-1">
          {PAYMENT_METHODS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={method === option}
              onClick={() => setMethod(option)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                method === option
                  ? "border-brand bg-brand text-brand-foreground"
                  : "hover:bg-accent",
              )}
            >
              {PAYMENT_METHOD_LABELS[option]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm leading-none font-medium">Status</legend>
        <div className="flex flex-wrap gap-2 pt-1">
          {PAYMENT_STATUSES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={status === option}
              onClick={() => setStatus(option)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                status === option
                  ? "border-brand bg-brand text-brand-foreground"
                  : "hover:bg-accent",
              )}
            >
              {PAYMENT_STATUS_LABELS[option]}
            </button>
          ))}
        </div>
      </fieldset>

      {membershipOptions && membershipOptions.length > 0 ? (
        <FormField
          id="membership-link"
          label="Against which membership?"
          hint="Optional — leave unlinked for anything else."
        >
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              aria-pressed={linkedMembership === ""}
              onClick={() => setLinkedMembership("")}
              className={classNames(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                linkedMembership === ""
                  ? "border-brand bg-brand text-brand-foreground"
                  : "hover:bg-accent",
              )}
            >
              Not linked
            </button>
            {membershipOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={linkedMembership === option.id}
                onClick={() => setLinkedMembership(option.id)}
                className={classNames(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  linkedMembership === option.id
                    ? "border-brand bg-brand text-brand-foreground"
                    : "hover:bg-accent",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </FormField>
      ) : null}

      <Field id="payment-notes" label="Notes" error={errors.notes}>
        <Textarea
          id="payment-notes"
          name="notes"
          rows={2}
          maxLength={2000}
          defaultValue={defaults?.notes ?? ""}
          placeholder="Reference number, part payment…"
        />
      </Field>

      <ConfirmSubmit
        title={paymentId ? "Save this payment?" : "Record this payment?"}
        description={
          paymentId
            ? "Updates the recorded amount, date, method and status."
            : "Adds a payment record against this customer. You can edit or delete it afterwards."
        }
        confirmLabel={paymentId ? "Save payment" : "Record payment"}
        pendingLabel="Saving…"
        className="w-full sm:w-auto"
      >
        {submitLabel}
      </ConfirmSubmit>
    </form>
  );
}
