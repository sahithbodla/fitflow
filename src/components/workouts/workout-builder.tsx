"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Play, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/form/field";
import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import { EmptyState } from "@/components/layout/empty-state";
import { Dumbbell } from "lucide-react";
import { idleFormState, type FormState } from "@/lib/actions/types";
import type {
  ExerciseItem,
  WorkoutDayItem,
  WorkoutExerciseItem,
} from "@/lib/workouts/queries";

/**
 * The workout builder.
 *
 * Every operation — adding a day, adding or editing an exercise, removing
 * either — is its own small form posting to a server action, rather than one
 * large client-side draft. The structure is always persisted, so a coach
 * cannot lose half-built work by navigating away or losing signal mid-session,
 * and each step works before hydration.
 */
export type BuilderActions = {
  addDay: (state: FormState, formData: FormData) => Promise<FormState>;
  updateDay: (state: FormState, formData: FormData) => Promise<FormState>;
  removeDay: (state: FormState, formData: FormData) => Promise<FormState>;
  addExercise: (state: FormState, formData: FormData) => Promise<FormState>;
  updateExercise: (state: FormState, formData: FormData) => Promise<FormState>;
  removeExercise: (state: FormState, formData: FormData) => Promise<FormState>;
};

/** Content signature for a day, used as a remount key. */
function dayFingerprint(day: WorkoutDayItem): string {
  return [
    day.name,
    day.notes,
    day.exercises.length,
    ...day.exercises.map(
      (entry) =>
        `${entry.id}|${entry.exerciseName}|${entry.sets}|${entry.reps}|${entry.rest}|${entry.notes}`,
    ),
  ].join("~");
}

export function WorkoutBuilder({
  days,
  library,
  actions,
  readOnlyNotice,
}: {
  days: WorkoutDayItem[];
  library: ExerciseItem[];
  actions: BuilderActions;
  readOnlyNotice?: string;
}) {
  return (
    <div className="space-y-4">
      {readOnlyNotice ? (
        <p className="text-muted-foreground text-sm text-pretty">
          {readOnlyNotice}
        </p>
      ) : null}

      {days.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No days yet"
          description="Add a training day — Day 1, Push, Legs, whatever you call it — then add exercises to it."
        />
      ) : (
        days.map((day, index) => (
          <DayCard
            // Keyed on content: a successful add, edit or removal changes this
            // key, remounting the card so any open sub-form collapses. Closing
            // them from an effect would mean setState during render commit.
            key={`${day.id}:${dayFingerprint(day)}`}
            day={day}
            index={index}
            library={library}
            actions={actions}
          />
        ))
      )}

      <AddDayForm
        key={`add-day-${days.length}`}
        action={actions.addDay}
        dayCount={days.length}
      />
    </div>
  );
}

function AddDayForm({
  action,
  dayCount,
}: {
  action: BuilderActions["addDay"];
  dayCount: number;
}) {
  const [state, formAction] = useActionState(action, idleFormState);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        Add a day
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4" noValidate>
          <FormAlert state={state} />

          <Field id="day-name" label="Day name" error={state.fieldErrors?.name} required>
            <Input
              id="day-name"
              name="name"
              required
              maxLength={80}
              defaultValue={`Day ${dayCount + 1}`}
              placeholder="Push"
              aria-invalid={Boolean(state.fieldErrors?.name)}
            />
          </Field>

          <Field id="day-notes" label="Notes" error={state.fieldErrors?.notes}>
            <Textarea
              id="day-notes"
              name="notes"
              rows={2}
              maxLength={500}
              placeholder="Warm up 10 minutes on the bike first."
            />
          </Field>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <SubmitButton pendingLabel="Adding…" className="flex-1">
              Add day
            </SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function DayCard({
  day,
  index,
  library,
  actions,
}: {
  day: WorkoutDayItem;
  index: number;
  library: ExerciseItem[];
  actions: BuilderActions;
}) {
  const [removeState, removeAction] = useActionState(
    actions.removeDay,
    idleFormState,
  );
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (removeState.status === "error" && removeState.message) {
      toast.error(removeState.message);
    }
  }, [removeState]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs">Day {index + 1}</p>
            <h3 className="text-base font-medium">{day.name}</h3>
            {day.notes ? (
              <p className="text-muted-foreground mt-1 text-sm text-pretty">
                {day.notes}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing((value) => !value)}
            >
              {editing ? "Close" : "Rename"}
            </Button>

            <form action={removeAction}>
              <input type="hidden" name="dayId" value={day.id} />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Remove {day.name}</span>
              </Button>
            </form>
          </div>
        </div>

        {editing ? (
          <EditDayForm day={day} action={actions.updateDay} />
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3">
        {day.exercises.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No exercises in this day yet.
          </p>
        ) : (
          <ol className="divide-y">
            {day.exercises.map((entry, position) => (
              <ExerciseRow
                key={entry.id}
                dayId={day.id}
                entry={entry}
                position={position}
                actions={actions}
              />
            ))}
          </ol>
        )}

        <AddExerciseForm dayId={day.id} library={library} action={actions.addExercise} />
      </CardContent>
    </Card>
  );
}

function EditDayForm({
  day,
  action,
}: {
  day: WorkoutDayItem;
  action: BuilderActions["updateDay"];
}) {
  const [state, formAction] = useActionState(action, idleFormState);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  return (
    <form action={formAction} className="mt-3 space-y-3" noValidate>
      <input type="hidden" name="dayId" value={day.id} />

      <FormAlert state={state} />

      <Input
        name="name"
        defaultValue={day.name}
        required
        maxLength={80}
        aria-label="Day name"
      />
      <Textarea
        name="notes"
        defaultValue={day.notes}
        rows={2}
        maxLength={500}
        aria-label="Day notes"
      />
      <SubmitButton className="w-full sm:w-auto">Save day</SubmitButton>
    </form>
  );
}

function ExerciseRow({
  dayId,
  entry,
  position,
  actions,
}: {
  dayId: string;
  entry: WorkoutExerciseItem;
  position: number;
  actions: BuilderActions;
}) {
  const [removeState, removeAction] = useActionState(
    actions.removeExercise,
    idleFormState,
  );
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (removeState.status === "error" && removeState.message) {
      toast.error(removeState.message);
    }
  }, [removeState]);

  const detail = [
    entry.sets ? `${entry.sets} sets` : null,
    entry.reps ? `${entry.reps} reps` : null,
    entry.rest ? `${entry.rest} rest` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            <span className="text-muted-foreground mr-1.5">{position + 1}.</span>
            {entry.exerciseName}
          </p>

          {detail ? (
            <p className="text-muted-foreground mt-0.5 text-xs">{detail}</p>
          ) : null}

          {entry.notes ? (
            <p className="text-muted-foreground/80 mt-0.5 text-xs text-pretty">
              {entry.notes}
            </p>
          ) : null}

          {entry.videoUrl ? (
            <a
              href={entry.videoUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-brand mt-1 inline-flex items-center gap-1 text-xs hover:underline"
            >
              <Play className="size-3" aria-hidden />
              Video
            </a>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? <X className="size-4" /> : "Edit"}
            <span className="sr-only">
              {editing ? "Close" : `Edit ${entry.exerciseName}`}
            </span>
          </Button>

          <form action={removeAction}>
            <input type="hidden" name="dayId" value={dayId} />
            <input type="hidden" name="entryId" value={entry.id} />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Remove {entry.exerciseName}</span>
            </Button>
          </form>
        </div>
      </div>

      {editing ? (
        <EditExerciseForm
          dayId={dayId}
          entry={entry}
          action={actions.updateExercise}
        />
      ) : null}
    </li>
  );
}

function EditExerciseForm({
  dayId,
  entry,
  action,
}: {
  dayId: string;
  entry: WorkoutExerciseItem;
  action: BuilderActions["updateExercise"];
}) {
  const [state, formAction] = useActionState(action, idleFormState);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  return (
    <form action={formAction} className="mt-3 space-y-3" noValidate>
      <input type="hidden" name="dayId" value={dayId} />
      <input type="hidden" name="entryId" value={entry.id} />

      <FormAlert state={state} />

      <Input
        name="exerciseName"
        defaultValue={entry.exerciseName}
        required
        maxLength={120}
        aria-label="Exercise name"
      />

      <div className="grid grid-cols-3 gap-2">
        <Input name="sets" defaultValue={entry.sets} maxLength={40} placeholder="Sets" aria-label="Sets" />
        <Input name="reps" defaultValue={entry.reps} maxLength={40} placeholder="Reps" aria-label="Reps" />
        <Input name="rest" defaultValue={entry.rest} maxLength={40} placeholder="Rest" aria-label="Rest" />
      </div>

      <Textarea
        name="notes"
        defaultValue={entry.notes}
        rows={2}
        maxLength={500}
        placeholder="Tempo, cues, substitutions…"
        aria-label="Exercise notes"
      />

      <SubmitButton className="w-full sm:w-auto">Save exercise</SubmitButton>
    </form>
  );
}

function AddExerciseForm({
  dayId,
  library,
  action,
}: {
  dayId: string;
  library: ExerciseItem[];
  action: BuilderActions["addExercise"];
}) {
  const [state, formAction] = useActionState(action, idleFormState);
  const [open, setOpen] = useState(false);
  const [exerciseId, setExerciseId] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        Add exercise
      </Button>
    );
  }

  const matches = query
    ? library.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase()),
      )
    : library;

  return (
    <form
      action={formAction}
      className="bg-muted/40 space-y-3 rounded-lg border p-3"
      noValidate
    >
      <input type="hidden" name="dayId" value={dayId} />
      <input type="hidden" name="exerciseId" value={exerciseId} />

      <FormAlert state={state} />

      {library.length > 0 ? (
        <div className="space-y-2">
          <label htmlFor={`lib-${dayId}`} className="text-sm font-medium">
            From your library
          </label>
          <Input
            id={`lib-${dayId}`}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setExerciseId("");
            }}
            placeholder="Search exercises"
          />
          <div className="max-h-44 space-y-1 overflow-y-auto">
            {matches.slice(0, 30).map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={exerciseId === item.id}
                onClick={() => setExerciseId(item.id)}
                className={
                  exerciseId === item.id
                    ? "border-brand bg-brand-soft w-full rounded-md border px-3 py-2 text-left text-sm"
                    : "hover:bg-accent w-full rounded-md border border-transparent px-3 py-2 text-left text-sm"
                }
              >
                {item.name}
              </button>
            ))}
            {matches.length === 0 ? (
              <p className="text-muted-foreground px-1 py-2 text-xs">
                Nothing matches. Type a one-off name below instead.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <Field
        id={`name-${dayId}`}
        label={library.length > 0 ? "Or type a one-off name" : "Exercise name"}
        error={state.fieldErrors?.exerciseName}
      >
        <Input
          id={`name-${dayId}`}
          name="exerciseName"
          maxLength={120}
          placeholder="Barbell back squat"
          aria-invalid={Boolean(state.fieldErrors?.exerciseName)}
        />
      </Field>

      <div className="grid grid-cols-3 gap-2">
        <Input name="sets" maxLength={40} placeholder="Sets" aria-label="Sets" />
        <Input name="reps" maxLength={40} placeholder="Reps" aria-label="Reps" />
        <Input name="rest" maxLength={40} placeholder="Rest" aria-label="Rest" />
      </div>

      <Textarea
        name="notes"
        rows={2}
        maxLength={500}
        placeholder="Tempo, cues, substitutions…"
        aria-label="Exercise notes"
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
        <SubmitButton size="sm" pendingLabel="Adding…" className="flex-1">
          Add
        </SubmitButton>
      </div>
    </form>
  );
}
