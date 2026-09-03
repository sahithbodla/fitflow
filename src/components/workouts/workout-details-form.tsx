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
  WORKOUT_GOALS,
  WORKOUT_GOAL_LABELS,
  type WorkoutGoal,
} from "@/lib/workouts/constants";

export type WorkoutDetailsDefaults = {
  name: string;
  description: string;
  goal: WorkoutGoal | "";
};

/** Name, description and goal — shared by templates and client plans. */
export function WorkoutDetailsForm({
  action,
  defaults,
  submitLabel,
  cancelHref,
  description,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults: WorkoutDetailsDefaults;
  submitLabel: string;
  cancelHref: string;
  description?: string;
}) {
  const [state, formAction] = useActionState(action, idleFormState);
  const [goal, setGoal] = useState<WorkoutGoal | "">(defaults.goal);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  const { errors, handleInput, alertState } = useFormErrors(state);
  const values = withSubmittedValues(
    { name: defaults.name, description: defaults.description },
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
      <input type="hidden" name="goal" value={goal} />

      <FormAlert state={alertState} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <Field id="name" label="Name" error={errors.name} required>
            <Input
              id="name"
              name="name"
              defaultValue={values.name}
              required
              maxLength={120}
              placeholder="4-Day Upper/Lower"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
          </Field>

          <Field
            id="description"
            label="Description"
            hint="Optional. Who it's for, how to run it."
            error={errors.description}
          >
            <Textarea
              id="description"
              name="description"
              defaultValue={values.description}
              rows={3}
              maxLength={1000}
              aria-describedby="description-hint"
            />
          </Field>

          <fieldset className="space-y-2">
            <legend className="text-sm leading-none font-medium">Goal</legend>
            <p className="text-muted-foreground text-xs">Optional.</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                aria-pressed={goal === ""}
                onClick={() => setGoal("")}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  goal === ""
                    ? "border-brand bg-brand text-brand-foreground"
                    : "hover:bg-accent",
                )}
              >
                None
              </button>
              {WORKOUT_GOALS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={goal === option}
                  onClick={() => setGoal(option)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    goal === option
                      ? "border-brand bg-brand text-brand-foreground"
                      : "hover:bg-accent",
                  )}
                >
                  {WORKOUT_GOAL_LABELS[option]}
                </button>
              ))}
            </div>
          </fieldset>
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
