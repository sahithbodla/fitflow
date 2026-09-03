"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { saveExerciseAction } from "@/lib/actions/workouts";
import { idleFormState } from "@/lib/actions/types";
import { useFormErrors } from "@/components/form/use-form-errors";
import { withSubmittedValues } from "@/lib/actions/merge-values";
import {
  EXERCISE_CATEGORIES,
  EXERCISE_CATEGORY_LABELS,
  type ExerciseCategory,
} from "@/lib/workouts/constants";

export type ExerciseFormDefaults = {
  name: string;
  category: ExerciseCategory | "";
  instructions: string;
  externalVideoUrl: string;
  active: boolean;
};

export function ExerciseForm({
  exerciseId,
  defaults,
}: {
  exerciseId: string | null;
  defaults: ExerciseFormDefaults;
}) {
  const action = saveExerciseAction.bind(null, exerciseId);
  const [state, formAction] = useActionState(action, idleFormState);
  const [category, setCategory] = useState<ExerciseCategory | "">(
    defaults.category,
  );
  const [active, setActive] = useState(defaults.active);

  const { errors, handleInput, alertState } = useFormErrors(state);
  const values = withSubmittedValues(
    {
      name: defaults.name,
      instructions: defaults.instructions,
      externalVideoUrl: defaults.externalVideoUrl,
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
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="active" value={active ? "yes" : "no"} />

      <FormAlert state={alertState} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exercise</CardTitle>
          <CardDescription>
            Used when building workout templates and client plans.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field id="name" label="Name" error={errors.name} required>
            <Input
              id="name"
              name="name"
              defaultValue={values.name}
              required
              maxLength={120}
              placeholder="Barbell back squat"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
          </Field>

          <fieldset className="space-y-2">
            <legend className="text-sm leading-none font-medium">
              Category
            </legend>
            <p className="text-muted-foreground text-xs">Optional.</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                aria-pressed={category === ""}
                onClick={() => setCategory("")}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  category === ""
                    ? "border-brand bg-brand text-brand-foreground"
                    : "hover:bg-accent",
                )}
              >
                None
              </button>
              {EXERCISE_CATEGORIES.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={category === option}
                  onClick={() => setCategory(option)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    category === option
                      ? "border-brand bg-brand text-brand-foreground"
                      : "hover:bg-accent",
                  )}
                >
                  {EXERCISE_CATEGORY_LABELS[option]}
                </button>
              ))}
            </div>
          </fieldset>

          <Field
            id="instructions"
            label="Instructions"
            hint="Optional. Cues and setup."
            error={errors.instructions}
          >
            <Textarea
              id="instructions"
              name="instructions"
              defaultValue={values.instructions}
              rows={4}
              maxLength={2000}
              aria-describedby="instructions-hint"
            />
          </Field>

          <Field
            id="externalVideoUrl"
            label="Video URL"
            hint="Optional. A YouTube or other link — videos are not uploaded."
            error={errors.externalVideoUrl}
          >
            <Input
              id="externalVideoUrl"
              name="externalVideoUrl"
              type="url"
              inputMode="url"
              autoCapitalize="none"
              defaultValue={values.externalVideoUrl}
              maxLength={500}
              placeholder="https://youtube.com/watch?v=…"
              aria-invalid={Boolean(errors.externalVideoUrl)}
              aria-describedby={
                errors.externalVideoUrl
                  ? "externalVideoUrl-error"
                  : "externalVideoUrl-hint"
              }
            />
          </Field>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="min-w-0">
              <Label htmlFor="active-switch">Available in the builder</Label>
              <p className="text-muted-foreground mt-0.5 text-xs text-pretty">
                Inactive exercises stay on existing workouts but are hidden when
                adding new ones.
              </p>
            </div>
            <Switch
              id="active-switch"
              checked={active}
              onCheckedChange={setActive}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <SubmitButton className="w-full sm:w-auto">
          {exerciseId ? "Save changes" : "Add exercise"}
        </SubmitButton>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/exercises">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
