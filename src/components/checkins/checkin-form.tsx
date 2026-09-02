"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
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
import { saveCheckInAction } from "@/lib/actions/checkins";
import { idleFormState } from "@/lib/actions/types";
import { withSubmittedValues } from "@/lib/actions/merge-values";
import {
  ADHERENCE_HINTS,
  ADHERENCE_LABELS,
  ADHERENCE_LEVELS,
  WEIGHT_UNITS,
  type AdherenceLevel,
  type WeightUnit,
} from "@/lib/checkins/constants";

export type CheckInFormDefaults = {
  checkInDate: string;
  weight: string;
  weightUnit: WeightUnit;
  dietAdherence: AdherenceLevel | "";
  workoutAdherence: AdherenceLevel | "";
  questions: string;
  coachNotes: string;
};

/** Adherence picker. "Not recorded" is a real choice, not an empty default. */
function AdherenceField({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: AdherenceLevel | "";
  onChange: (value: AdherenceLevel | "") => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm leading-none font-medium">{label}</legend>
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          aria-pressed={value === ""}
          onClick={() => onChange("")}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm transition-colors",
            value === ""
              ? "border-brand bg-brand text-brand-foreground"
              : "hover:bg-accent",
          )}
        >
          Not recorded
        </button>
        {ADHERENCE_LEVELS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            title={ADHERENCE_HINTS[option]}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              value === option
                ? "border-brand bg-brand text-brand-foreground"
                : "hover:bg-accent",
            )}
          >
            {ADHERENCE_LABELS[option]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function CheckInForm({
  checkInId,
  coachingClientId,
  defaults,
  submitLabel,
  cancelHref,
  compact,
}: {
  checkInId: string | null;
  coachingClientId: string;
  defaults: CheckInFormDefaults;
  submitLabel: string;
  cancelHref?: string;
  /** Inline "quick add" variant used on the check-ins tab. */
  compact?: boolean;
}) {
  const action = saveCheckInAction.bind(null, checkInId);
  const [state, formAction] = useActionState(action, idleFormState);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(defaults.weightUnit);
  const [diet, setDiet] = useState<AdherenceLevel | "">(defaults.dietAdherence);
  const [workout, setWorkout] = useState<AdherenceLevel | "">(
    defaults.workoutAdherence,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  const errors = state.fieldErrors ?? {};
  const values = withSubmittedValues(
    {
      checkInDate: defaults.checkInDate,
      weight: defaults.weight,
      questions: defaults.questions,
      coachNotes: defaults.coachNotes,
    },
    state,
  );

  const body = (
    <div className="space-y-4">
      <FormAlert state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="checkInDate"
          label="Check-in date"
          error={errors.checkInDate}
          required
        >
          <Input
            id="checkInDate"
            name="checkInDate"
            type="date"
            defaultValue={values.checkInDate}
            required
            aria-invalid={Boolean(errors.checkInDate)}
            aria-describedby={
              errors.checkInDate ? "checkInDate-error" : undefined
            }
          />
        </Field>

        <Field id="weight" label="Weight" hint="Optional." error={errors.weight}>
          <div className="flex gap-2">
            <Input
              id="weight"
              name="weight"
              type="number"
              inputMode="decimal"
              step="0.1"
              min={0}
              defaultValue={values.weight}
              placeholder="72.4"
              className="flex-1"
              aria-invalid={Boolean(errors.weight)}
              aria-describedby={errors.weight ? "weight-error" : "weight-hint"}
            />
            <input type="hidden" name="weightUnit" value={weightUnit} />
            <div className="flex shrink-0 gap-1">
              {WEIGHT_UNITS.map((unit) => (
                <button
                  key={unit}
                  type="button"
                  aria-pressed={weightUnit === unit}
                  onClick={() => setWeightUnit(unit)}
                  className={cn(
                    "rounded-md border px-3 text-sm transition-colors",
                    weightUnit === unit
                      ? "border-brand bg-brand text-brand-foreground"
                      : "hover:bg-accent",
                  )}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        </Field>
      </div>

      <AdherenceField
        name="dietAdherence"
        label="Diet adherence"
        value={diet}
        onChange={setDiet}
      />

      <AdherenceField
        name="workoutAdherence"
        label="Workout adherence"
        value={workout}
        onChange={setWorkout}
      />

      <Field
        id="questions"
        label="Their questions"
        hint="What they asked you this week."
        error={errors.questions}
      >
        <Textarea
          id="questions"
          name="questions"
          defaultValue={values.questions}
          rows={2}
          maxLength={2000}
          aria-describedby="questions-hint"
        />
      </Field>

      <Field
        id="coachNotes"
        label="Your notes"
        hint="Internal — not shared with the client."
        error={errors.coachNotes}
      >
        <Textarea
          id="coachNotes"
          name="coachNotes"
          defaultValue={values.coachNotes}
          rows={2}
          maxLength={2000}
          aria-describedby="coachNotes-hint"
        />
      </Field>
    </div>
  );

  return (
    <form
      key={state.values ? JSON.stringify(state.values) : "initial"}
      action={formAction}
      ref={formRef}
      className="space-y-5"
      noValidate
    >
      <input type="hidden" name="coachingClientId" value={coachingClientId} />

      {compact ? (
        body
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Check-in</CardTitle>
            <CardDescription>
              Everything except the date is optional — record what you actually
              have.
            </CardDescription>
          </CardHeader>
          <CardContent>{body}</CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <SubmitButton className="w-full sm:w-auto">{submitLabel}</SubmitButton>
        {cancelHref ? (
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={cancelHref}>Cancel</Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
