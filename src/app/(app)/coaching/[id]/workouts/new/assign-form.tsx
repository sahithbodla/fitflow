"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { assignWorkoutAction } from "@/lib/actions/workouts";
import { idleFormState } from "@/lib/actions/types";
import { WORKOUT_GOAL_LABELS } from "@/lib/workouts/constants";
import type { WorkoutTemplateItem } from "@/lib/workouts/queries";

export function AssignWorkoutForm({
  coachingClientId,
  clientName,
  templates,
  today,
}: {
  coachingClientId: string;
  clientName: string;
  templates: WorkoutTemplateItem[];
  today: string;
}) {
  const [state, formAction] = useActionState(assignWorkoutAction, idleFormState);
  const [templateId, setTemplateId] = useState("");
  const [name, setName] = useState("");

  const errors = state.fieldErrors ?? {};

  const pick = (template: WorkoutTemplateItem | null) => {
    setTemplateId(template?.id ?? "");
    setName(template ? template.name : "");
  };

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="coachingClientId" value={coachingClientId} />
      <input type="hidden" name="templateId" value={templateId} />

      <FormAlert state={state} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Start from</CardTitle>
          <CardDescription>
            A template gives {clientName} their own copy — editing it later
            never changes the template.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <button
            type="button"
            aria-pressed={templateId === ""}
            onClick={() => pick(null)}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
              templateId === ""
                ? "border-brand bg-brand-soft"
                : "hover:bg-accent/50",
            )}
          >
            <span
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2",
                templateId === ""
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-muted-foreground/40",
              )}
              aria-hidden
            >
              {templateId === "" ? <Check className="size-3" /> : null}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">Blank plan</span>
              <span className="text-muted-foreground block text-xs">
                Build days and exercises from scratch.
              </span>
            </span>
          </button>

          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              aria-pressed={templateId === template.id}
              onClick={() => pick(template)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                templateId === template.id
                  ? "border-brand bg-brand-soft"
                  : "hover:bg-accent/50",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2",
                  templateId === template.id
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-muted-foreground/40",
                )}
                aria-hidden
              >
                {templateId === template.id ? <Check className="size-3" /> : null}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  <FileText className="size-3.5 shrink-0" aria-hidden />
                  {template.name}
                  {template.goal ? (
                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-normal">
                      {WORKOUT_GOAL_LABELS[template.goal]}
                    </span>
                  ) : null}
                </span>
                <span className="text-muted-foreground mt-0.5 block text-xs">
                  {template.dayCount}{" "}
                  {template.dayCount === 1 ? "day" : "days"} ·{" "}
                  {template.exerciseCount}{" "}
                  {template.exerciseCount === 1 ? "exercise" : "exercises"}
                </span>
              </span>
            </button>
          ))}

          {templates.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No active templates yet.{" "}
              <Link href="/workouts/new" className="underline">
                Create one
              </Link>{" "}
              or start blank.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            id="name"
            label="Plan name"
            error={errors.name}
            required
            className="sm:col-span-2"
          >
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={120}
              placeholder="September block"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
          </Field>

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
              defaultValue={today}
              required
              aria-invalid={Boolean(errors.startDate)}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <SubmitButton pendingLabel="Creating…" className="w-full sm:w-auto">
          Create plan
        </SubmitButton>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={`/coaching/${coachingClientId}?tab=workouts`}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
