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
import { saveDietPlanAction } from "@/lib/actions/diet";
import { idleFormState } from "@/lib/actions/types";
import { useFormErrors } from "@/components/form/use-form-errors";
import { withSubmittedValues } from "@/lib/actions/merge-values";
import {
  DIET_GOALS,
  DIET_GOAL_LABELS,
  type DietGoal,
} from "@/lib/diet/constants";

export type DietPlanFormDefaults = {
  title: string;
  goal: DietGoal | "";
  notes: string;
  calorieTarget: string;
  proteinTarget: string;
  carbTarget: string;
  fatTarget: string;
  startDate: string;
};

export function DietPlanForm({
  planId,
  coachingClientId,
  clientName,
  defaults,
  submitLabel,
  cancelHref,
}: {
  planId: string | null;
  coachingClientId: string;
  clientName: string;
  defaults: DietPlanFormDefaults;
  submitLabel: string;
  cancelHref: string;
}) {
  const action = saveDietPlanAction.bind(null, planId);
  const [state, formAction] = useActionState(action, idleFormState);
  const [goal, setGoal] = useState<DietGoal | "">(defaults.goal);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  const { errors, handleInput, alertState } = useFormErrors(state);
  const values = withSubmittedValues(
    {
      title: defaults.title,
      notes: defaults.notes,
      calorieTarget: defaults.calorieTarget,
      proteinTarget: defaults.proteinTarget,
      carbTarget: defaults.carbTarget,
      fatTarget: defaults.fatTarget,
      startDate: defaults.startDate,
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
      <input type="hidden" name="coachingClientId" value={coachingClientId} />
      <input type="hidden" name="goal" value={goal} />

      <FormAlert state={alertState} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan details</CardTitle>
          <CardDescription>For {clientName}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field id="title" label="Title" error={errors.title} required>
            <Input
              id="title"
              name="title"
              defaultValue={values.title}
              required
              maxLength={120}
              placeholder="September cutting plan"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "title-error" : undefined}
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
              {DIET_GOALS.map((option) => (
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
                  {DIET_GOAL_LABELS[option]}
                </button>
              ))}
            </div>
          </fieldset>

          <Field
            id="startDate"
            label="Start date"
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
            />
          </Field>

          <Field
            id="notes"
            label="Notes"
            hint="Hydration, supplements, anything general."
            error={errors.notes}
          >
            <Textarea
              id="notes"
              name="notes"
              defaultValue={values.notes}
              rows={3}
              maxLength={2000}
              aria-describedby="notes-hint"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Targets</CardTitle>
          <CardDescription>
            All optional, and all stored exactly as you type them — FitFlow does
            not calculate or check them against the foods below.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field id="calorieTarget" label="Calories" error={errors.calorieTarget}>
            <Input
              id="calorieTarget"
              name="calorieTarget"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={values.calorieTarget}
              placeholder="2200"
            />
          </Field>
          <Field id="proteinTarget" label="Protein (g)" error={errors.proteinTarget}>
            <Input
              id="proteinTarget"
              name="proteinTarget"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={values.proteinTarget}
              placeholder="160"
            />
          </Field>
          <Field id="carbTarget" label="Carbs (g)" error={errors.carbTarget}>
            <Input
              id="carbTarget"
              name="carbTarget"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={values.carbTarget}
              placeholder="220"
            />
          </Field>
          <Field id="fatTarget" label="Fat (g)" error={errors.fatTarget}>
            <Input
              id="fatTarget"
              name="fatTarget"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={values.fatTarget}
              placeholder="60"
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
