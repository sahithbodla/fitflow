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
import { savePlanAction } from "@/lib/actions/memberships";
import { idleFormState } from "@/lib/actions/types";
import { withSubmittedValues } from "@/lib/actions/merge-values";
import {
  MEMBERSHIP_CATEGORIES,
  MEMBERSHIP_CATEGORY_LABELS,
  type MembershipCategory,
} from "@/lib/memberships/constants";

export type PlanFormDefaults = {
  name: string;
  category: MembershipCategory;
  description: string;
  defaultDurationDays: string;
  defaultPrice: string;
  active: boolean;
};

export function PlanForm({
  planId,
  defaults,
  currency,
}: {
  planId: string | null;
  defaults: PlanFormDefaults;
  currency: string;
}) {
  const action = savePlanAction.bind(null, planId);
  const [state, formAction] = useActionState(action, idleFormState);
  const [category, setCategory] = useState<MembershipCategory>(
    defaults.category,
  );
  const [active, setActive] = useState(defaults.active);

  const errors = state.fieldErrors ?? {};
  const values = withSubmittedValues(
    {
      name: defaults.name,
      description: defaults.description,
      defaultDurationDays: defaults.defaultDurationDays,
      defaultPrice: defaults.defaultPrice,
    },
    state,
  );

  return (
    <form
      key={state.values ? JSON.stringify(state.values) : "initial"}
      action={formAction}
      className="space-y-5"
      noValidate
    >
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="active" value={active ? "yes" : "no"} />

      <FormAlert state={state} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan details</CardTitle>
          <CardDescription>
            Duration and price are suggestions that prefill the membership form.
            Every membership stores its own dates and price, so editing a plan
            never changes what an existing member bought.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field id="name" label="Plan name" error={errors.name} required>
            <Input
              id="name"
              name="name"
              defaultValue={values.name}
              required
              maxLength={120}
              placeholder="3 Month Gym"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
          </Field>

          <fieldset className="space-y-2">
            <legend className="text-sm leading-none font-medium">
              Category
              <span className="text-destructive" aria-hidden>
                *
              </span>
            </legend>
            <div className="flex flex-wrap gap-2 pt-1">
              {MEMBERSHIP_CATEGORIES.map((option) => (
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
                  {MEMBERSHIP_CATEGORY_LABELS[option]}
                </button>
              ))}
            </div>
          </fieldset>

          <Field
            id="description"
            label="Description"
            hint="Optional. What's included."
            error={errors.description}
          >
            <Textarea
              id="description"
              name="description"
              defaultValue={values.description}
              rows={2}
              maxLength={500}
              aria-describedby="description-hint"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Defaults</CardTitle>
          <CardDescription>
            Both optional — leave blank for session-based or variable-price
            plans.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            id="defaultDurationDays"
            label="Default duration (days)"
            hint="Used to suggest an expiry date."
            error={errors.defaultDurationDays}
          >
            <Input
              id="defaultDurationDays"
              name="defaultDurationDays"
              type="number"
              inputMode="numeric"
              min={1}
              max={3650}
              defaultValue={values.defaultDurationDays}
              placeholder="90"
              aria-describedby="defaultDurationDays-hint"
            />
          </Field>

          <Field
            id="defaultPrice"
            label={`Default price (${currency})`}
            error={errors.defaultPrice}
          >
            <Input
              id="defaultPrice"
              name="defaultPrice"
              type="number"
              inputMode="decimal"
              min={0}
              defaultValue={values.defaultPrice}
              placeholder="6000"
            />
          </Field>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-4 sm:col-span-2">
            <div className="min-w-0">
              <Label htmlFor="active-switch">Available to sell</Label>
              <p className="text-muted-foreground mt-0.5 text-xs text-pretty">
                Inactive plans stay on existing memberships but are hidden when
                creating a new one.
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
          {planId ? "Save changes" : "Create plan"}
        </SubmitButton>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/plans">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
