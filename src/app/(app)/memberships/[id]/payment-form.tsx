"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form/field";
import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import { cn } from "@/lib/utils";
import { recordPaymentAction } from "@/lib/actions/memberships";
import { idleFormState } from "@/lib/actions/types";
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
  personId,
  membershipId,
  currency,
  today,
  defaultAmount,
}: {
  personId: string;
  membershipId?: string;
  currency: string;
  today: string;
  defaultAmount?: string;
}) {
  const [state, formAction] = useActionState(recordPaymentAction, idleFormState);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [status, setStatus] = useState<PaymentStatus>("paid");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      if (state.message) toast.success(state.message);
    }
  }, [state]);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} ref={formRef} className="space-y-4" noValidate>
      <input type="hidden" name="personId" value={personId} />
      {membershipId ? (
        <input type="hidden" name="membershipId" value={membershipId} />
      ) : null}
      <input type="hidden" name="method" value={method} />
      <input type="hidden" name="status" value={status} />

      <FormAlert state={state} />

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
            defaultValue={defaultAmount ?? ""}
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
            defaultValue={today}
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

      <Field id="payment-notes" label="Notes" error={errors.notes}>
        <Textarea
          id="payment-notes"
          name="notes"
          rows={2}
          maxLength={2000}
          placeholder="Reference number, part payment…"
        />
      </Field>

      <SubmitButton pendingLabel="Recording…" className="w-full sm:w-auto">
        Record payment
      </SubmitButton>
    </form>
  );
}
