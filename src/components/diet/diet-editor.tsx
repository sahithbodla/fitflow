"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, UtensilsCrossed, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/form/field";
import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import { EmptyState } from "@/components/layout/empty-state";
import { idleFormState, type FormState } from "@/lib/actions/types";
import { COMMON_MEAL_NAMES } from "@/lib/diet/constants";
import type { DietMealView, DietPlanView } from "@/lib/diet/queries";

/**
 * Meal-by-meal diet editor.
 *
 * Like the workout builder, every change is its own form posting to a server
 * action, so the plan is always saved and a coach cannot lose a half-typed
 * plan. Sub-forms collapse by remounting on the data that changed.
 */
export type DietEditorActions = {
  addMeal: (state: FormState, formData: FormData) => Promise<FormState>;
  updateMeal: (state: FormState, formData: FormData) => Promise<FormState>;
  removeMeal: (state: FormState, formData: FormData) => Promise<FormState>;
  addItem: (state: FormState, formData: FormData) => Promise<FormState>;
  updateItem: (state: FormState, formData: FormData) => Promise<FormState>;
  removeItem: (state: FormState, formData: FormData) => Promise<FormState>;
};

function mealFingerprint(meal: DietMealView): string {
  return [
    meal.name,
    meal.time,
    meal.notes,
    meal.items.length,
    ...meal.items.map(
      (item) => `${item.id}|${item.food}|${item.quantity}|${item.notes}`,
    ),
  ].join("~");
}

export function DietEditor({
  plan,
  actions,
}: {
  plan: DietPlanView;
  actions: DietEditorActions;
}) {
  return (
    <div className="space-y-4">
      {plan.meals.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No meals yet"
          description="Add a meal section — Breakfast, Lunch, Post-workout — then list what goes in it."
        />
      ) : (
        plan.meals.map((meal) => (
          <MealCard
            key={`${meal.id}:${mealFingerprint(meal)}`}
            meal={meal}
            actions={actions}
          />
        ))
      )}

      <AddMealForm
        key={`add-meal-${plan.meals.length}`}
        action={actions.addMeal}
        usedNames={plan.meals.map((meal) => meal.name)}
      />
    </div>
  );
}

function AddMealForm({
  action,
  usedNames,
}: {
  action: DietEditorActions["addMeal"];
  usedNames: string[];
}) {
  const [state, formAction] = useActionState(action, idleFormState);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

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
        Add a meal
      </Button>
    );
  }

  const suggestions = COMMON_MEAL_NAMES.filter(
    (value) => !usedNames.includes(value),
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4" noValidate>
          <FormAlert state={state} />

          {suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setName(value)}
                  className="hover:bg-accent rounded-full border px-3 py-1.5 text-sm transition-colors"
                >
                  {value}
                </button>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="meal-name"
              label="Meal name"
              error={state.fieldErrors?.name}
              required
            >
              <Input
                id="meal-name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={80}
                placeholder="Breakfast"
                aria-invalid={Boolean(state.fieldErrors?.name)}
              />
            </Field>

            <Field
              id="meal-time"
              label="Time"
              hint="Optional, e.g. 8:00 am."
              error={state.fieldErrors?.time}
            >
              <Input
                id="meal-time"
                name="time"
                maxLength={40}
                placeholder="8:00 am"
                aria-describedby="meal-time-hint"
              />
            </Field>
          </div>

          <Field id="meal-notes" label="Notes" error={state.fieldErrors?.notes}>
            <Textarea
              id="meal-notes"
              name="notes"
              rows={2}
              maxLength={500}
              placeholder="Within an hour of waking."
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
              Add meal
            </SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function MealCard({
  meal,
  actions,
}: {
  meal: DietMealView;
  actions: DietEditorActions;
}) {
  const [removeState, removeAction] = useActionState(
    actions.removeMeal,
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
            <h3 className="text-base font-medium">
              {meal.name}
              {meal.time ? (
                <span className="text-muted-foreground ml-2 text-sm font-normal">
                  {meal.time}
                </span>
              ) : null}
            </h3>
            {meal.notes ? (
              <p className="text-muted-foreground mt-1 text-sm text-pretty">
                {meal.notes}
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
              {editing ? "Close" : "Edit"}
            </Button>

            <form action={removeAction}>
              <input type="hidden" name="mealId" value={meal.id} />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Remove {meal.name}</span>
              </Button>
            </form>
          </div>
        </div>

        {editing ? (
          <EditMealForm meal={meal} action={actions.updateMeal} />
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3">
        {meal.items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing listed yet.</p>
        ) : (
          <ul className="divide-y">
            {meal.items.map((item) => (
              <ItemRow
                key={item.id}
                mealId={meal.id}
                item={item}
                actions={actions}
              />
            ))}
          </ul>
        )}

        <AddItemForm mealId={meal.id} action={actions.addItem} />
      </CardContent>
    </Card>
  );
}

function EditMealForm({
  meal,
  action,
}: {
  meal: DietMealView;
  action: DietEditorActions["updateMeal"];
}) {
  const [state, formAction] = useActionState(action, idleFormState);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  return (
    <form action={formAction} className="mt-3 space-y-3" noValidate>
      <input type="hidden" name="mealId" value={meal.id} />
      <FormAlert state={state} />

      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          name="name"
          defaultValue={meal.name}
          required
          maxLength={80}
          aria-label="Meal name"
        />
        <Input
          name="time"
          defaultValue={meal.time}
          maxLength={40}
          placeholder="Time"
          aria-label="Meal time"
        />
      </div>

      <Textarea
        name="notes"
        defaultValue={meal.notes}
        rows={2}
        maxLength={500}
        aria-label="Meal notes"
      />

      <SubmitButton className="w-full sm:w-auto">Save meal</SubmitButton>
    </form>
  );
}

function ItemRow({
  mealId,
  item,
  actions,
}: {
  mealId: string;
  item: { id: string; food: string; quantity: string; notes: string };
  actions: DietEditorActions;
}) {
  const [removeState, removeAction] = useActionState(
    actions.removeItem,
    idleFormState,
  );
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (removeState.status === "error" && removeState.message) {
      toast.error(removeState.message);
    }
  }, [removeState]);

  return (
    <li className="py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm">
            <span className="font-medium">{item.food}</span>
            {item.quantity ? (
              <span className="text-muted-foreground"> · {item.quantity}</span>
            ) : null}
          </p>
          {item.notes ? (
            <p className="text-muted-foreground/80 mt-0.5 text-xs text-pretty">
              {item.notes}
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
            {editing ? <X className="size-4" /> : "Edit"}
            <span className="sr-only">
              {editing ? "Close" : `Edit ${item.food}`}
            </span>
          </Button>

          <form action={removeAction}>
            <input type="hidden" name="mealId" value={mealId} />
            <input type="hidden" name="itemId" value={item.id} />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Remove {item.food}</span>
            </Button>
          </form>
        </div>
      </div>

      {editing ? (
        <EditItemForm mealId={mealId} item={item} action={actions.updateItem} />
      ) : null}
    </li>
  );
}

function EditItemForm({
  mealId,
  item,
  action,
}: {
  mealId: string;
  item: { id: string; food: string; quantity: string; notes: string };
  action: DietEditorActions["updateItem"];
}) {
  const [state, formAction] = useActionState(action, idleFormState);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  return (
    <form action={formAction} className="mt-3 space-y-3" noValidate>
      <input type="hidden" name="mealId" value={mealId} />
      <input type="hidden" name="itemId" value={item.id} />
      <FormAlert state={state} />

      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          name="food"
          defaultValue={item.food}
          required
          maxLength={160}
          aria-label="Food"
        />
        <Input
          name="quantity"
          defaultValue={item.quantity}
          maxLength={80}
          placeholder="Quantity"
          aria-label="Quantity"
        />
      </div>

      <Input
        name="notes"
        defaultValue={item.notes}
        maxLength={300}
        placeholder="Notes"
        aria-label="Food notes"
      />

      <SubmitButton className="w-full sm:w-auto">Save food</SubmitButton>
    </form>
  );
}

function AddItemForm({
  mealId,
  action,
}: {
  mealId: string;
  action: DietEditorActions["addItem"];
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
        size="sm"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        Add food
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="bg-muted/40 space-y-3 rounded-lg border p-3"
      noValidate
    >
      <input type="hidden" name="mealId" value={mealId} />
      <FormAlert state={state} />

      <div className="grid gap-2 sm:grid-cols-2">
        <Field id={`food-${mealId}`} label="Food" error={state.fieldErrors?.food} required>
          <Input
            id={`food-${mealId}`}
            name="food"
            required
            maxLength={160}
            placeholder="Oats"
            aria-invalid={Boolean(state.fieldErrors?.food)}
          />
        </Field>

        <Field id={`qty-${mealId}`} label="Quantity" error={state.fieldErrors?.quantity}>
          <Input
            id={`qty-${mealId}`}
            name="quantity"
            maxLength={80}
            placeholder="80g"
          />
        </Field>
      </div>

      <Input
        name="notes"
        maxLength={300}
        placeholder="Notes — swaps, prep…"
        aria-label="Food notes"
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
