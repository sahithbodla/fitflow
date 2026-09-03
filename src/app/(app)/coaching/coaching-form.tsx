"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/form/field";
import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import { cn } from "@/lib/utils";
import { idleFormState, type FormState } from "@/lib/actions/types";
import { useFormErrors } from "@/components/form/use-form-errors";
import { withSubmittedValues } from "@/lib/actions/merge-values";
import {
  COACHING_STATUSES,
  COACHING_STATUS_LABELS,
  type CoachingStatus,
} from "@/lib/people/constants";

export type CoachingFormDefaults = {
  status: CoachingStatus;
  startDate: string;
  endDate: string;
  goal: string;
  notes: string;
};

export function CoachingForm({
  action,
  personId,
  personName,
  defaults,
  submitLabel,
  cancelHref,
  showStatus = true,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  personId: string;
  personName: string;
  defaults: CoachingFormDefaults;
  submitLabel: string;
  cancelHref: string;
  showStatus?: boolean;
}) {
  const [state, formAction] = useActionState(action, idleFormState);
  const [status, setStatus] = useState<CoachingStatus>(defaults.status);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  const { errors, handleInput, alertState } = useFormErrors(state);
  const values = withSubmittedValues(
    {
      startDate: defaults.startDate,
      endDate: defaults.endDate,
      goal: defaults.goal,
      notes: defaults.notes,
    },
    state,
  );

  return (
    <form
      key={state.values ? JSON.stringify(state.values) : "initial"}
      action={formAction}
      onInput={handleInput}
      className="space-y-5"
      noValidate
    >
      <input type="hidden" name="personId" value={personId} />
      <input type="hidden" name="status" value={status} />

      <FormAlert state={alertState} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coaching details</CardTitle>
          <CardDescription>For {personName}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showStatus ? (
            <fieldset className="space-y-2">
              <legend className="text-sm leading-none font-medium">Status</legend>
              <div className="flex flex-wrap gap-2 pt-1">
                {COACHING_STATUSES.map((option) => (
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
                    {COACHING_STATUS_LABELS[option]}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="startDate"
              label="Coaching start date"
              error={errors.startDate}
              required
            >
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={values.startDate}
                required
                aria-invalid={Boolean(errors.startDate)}
                aria-describedby={
                  errors.startDate ? "startDate-error" : undefined
                }
              />
            </Field>

            <Field
              id="endDate"
              label="End date"
              hint="Optional. Leave blank while coaching is ongoing."
              error={errors.endDate}
            >
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={values.endDate}
                aria-invalid={Boolean(errors.endDate)}
                aria-describedby={
                  errors.endDate ? "endDate-error" : "endDate-hint"
                }
              />
            </Field>
          </div>

          <Field
            id="goal"
            label="Goal"
            hint="What they're working towards."
            error={errors.goal}
          >
            <Textarea
              id="goal"
              name="goal"
              defaultValue={values.goal}
              rows={3}
              maxLength={1000}
              placeholder="Lose 8kg and build a consistent 4-day routine."
              aria-describedby="goal-hint"
            />
          </Field>

          <Field
            id="notes"
            label="Coach notes"
            hint="Internal. Injuries, preferences, anything to remember."
            error={errors.notes}
          >
            <Textarea
              id="notes"
              name="notes"
              defaultValue={values.notes}
              rows={4}
              maxLength={2000}
              aria-describedby="notes-hint"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <SubmitButton className="w-full sm:w-auto">{submitLabel}</SubmitButton>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
