"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Info } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field } from "@/components/form/field";
import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import { cn } from "@/lib/utils";
import { idleFormState, type FormState } from "@/lib/actions/types";
import { withSubmittedValues } from "@/lib/actions/merge-values";
import {
  MEMBERSHIP_CATEGORIES,
  MEMBERSHIP_CATEGORY_LABELS,
  type MembershipCategory,
} from "@/lib/memberships/constants";
import type { PlanListItem } from "@/lib/memberships/queries";

export type MembershipFormDefaults = {
  planId: string;
  planName: string;
  category: MembershipCategory;
  purchaseDate: string;
  startDate: string;
  expiryDate: string;
  price: string;
  notes: string;
};

/** Adds days to a `yyyy-mm-dd` string without going near timezones. */
function addDays(dateString: string, days: number): string {
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return dateString;
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function MembershipForm({
  action,
  personId,
  personName,
  plans,
  defaults,
  currency,
  renewedFrom,
  submitLabel,
  cancelHref,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  personId: string;
  personName: string;
  plans: PlanListItem[];
  defaults: MembershipFormDefaults;
  currency: string;
  renewedFrom?: string;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction] = useActionState(action, idleFormState);

  const [category, setCategory] = useState<MembershipCategory>(
    defaults.category,
  );
  const [planId, setPlanId] = useState(defaults.planId);
  const [planName, setPlanName] = useState(defaults.planName);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [expiryDate, setExpiryDate] = useState(defaults.expiryDate);
  const [price, setPrice] = useState(defaults.price);

  const errors = state.fieldErrors ?? {};
  const values = withSubmittedValues(
    { purchaseDate: defaults.purchaseDate, notes: defaults.notes },
    state,
  );

  const categoryPlans = plans.filter((plan) => plan.category === category);

  /**
   * Selecting a plan *suggests* its duration and price. Both remain fully
   * editable — the business explicitly needs per-member dates and pricing.
   */
  const applyPlan = (plan: PlanListItem) => {
    setPlanId(plan.id);
    setPlanName(plan.name);
    if (plan.defaultPrice !== null) setPrice(String(plan.defaultPrice));
    if (plan.defaultDurationDays && startDate) {
      setExpiryDate(addDays(startDate, plan.defaultDurationDays));
    }
  };

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="personId" value={personId} />
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="status" value="active" />
      {renewedFrom ? (
        <input type="hidden" name="renewedFrom" value={renewedFrom} />
      ) : null}

      <FormAlert state={state} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What are they buying?</CardTitle>
          <CardDescription>For {personName}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm leading-none font-medium">Category</legend>
            <div className="flex flex-wrap gap-2 pt-1">
              {MEMBERSHIP_CATEGORIES.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={category === option}
                  onClick={() => {
                    setCategory(option);
                    setPlanId("");
                  }}
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

          {categoryPlans.length > 0 ? (
            <fieldset className="space-y-2">
              <legend className="text-sm leading-none font-medium">
                Plan
              </legend>
              <p className="text-muted-foreground text-xs">
                Prefills the price and expiry. You can change both.
              </p>
              <div className="grid gap-2 pt-1">
                {categoryPlans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    aria-pressed={planId === plan.id}
                    onClick={() => applyPlan(plan)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
                      planId === plan.id
                        ? "border-brand bg-brand-soft"
                        : "hover:bg-accent/50",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {plan.name}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        {plan.defaultDurationDays
                          ? `${plan.defaultDurationDays} days`
                          : "No default duration"}
                        {plan.defaultPrice !== null
                          ? ` · ${currency} ${plan.defaultPrice}`
                          : ""}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
          ) : (
            <Alert>
              <Info className="size-4" />
              <AlertDescription>
                No active {MEMBERSHIP_CATEGORY_LABELS[category].toLowerCase()}{" "}
                plans yet. You can still type a name below, or{" "}
                <Link href="/plans/new" className="underline">
                  create a plan
                </Link>
                .
              </AlertDescription>
            </Alert>
          )}

          <Field
            id="planName"
            label="Membership name"
            hint="What appears on the member's record."
            error={errors.planName}
            required
          >
            <Input
              id="planName"
              name="planName"
              value={planName}
              onChange={(event) => setPlanName(event.target.value)}
              required
              maxLength={120}
              placeholder="3 Month Gym"
              aria-invalid={Boolean(errors.planName)}
              aria-describedby={
                errors.planName ? "planName-error" : "planName-hint"
              }
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dates</CardTitle>
          <CardDescription>
            Set each date independently. Expiry is never calculated from the
            purchase date — a member can pay today and start next month.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field
            id="purchaseDate"
            label="Purchase date"
            error={errors.purchaseDate}
            required
          >
            <Input
              id="purchaseDate"
              name="purchaseDate"
              type="date"
              defaultValue={values.purchaseDate}
              required
              aria-invalid={Boolean(errors.purchaseDate)}
              aria-describedby={
                errors.purchaseDate ? "purchaseDate-error" : undefined
              }
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
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
              aria-invalid={Boolean(errors.startDate)}
              aria-describedby={
                errors.startDate ? "startDate-error" : undefined
              }
            />
          </Field>

          <Field
            id="expiryDate"
            label="Expiry date"
            error={errors.expiryDate}
            required
          >
            <Input
              id="expiryDate"
              name="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(event) => setExpiryDate(event.target.value)}
              required
              aria-invalid={Boolean(errors.expiryDate)}
              aria-describedby={
                errors.expiryDate ? "expiryDate-error" : undefined
              }
            />
          </Field>

          <p className="text-muted-foreground sm:col-span-3 text-xs">
            Access runs from the start date to the end of the expiry date,
            inclusive.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Price &amp; notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            id="price"
            label={`Price (${currency})`}
            hint="Optional. Overrides the plan's default for this member."
            error={errors.price}
          >
            <Input
              id="price"
              name="price"
              type="number"
              inputMode="decimal"
              min={0}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              aria-describedby={errors.price ? "price-error" : "price-hint"}
            />
          </Field>

          <Field id="notes" label="Notes" error={errors.notes}>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={values.notes}
              rows={3}
              maxLength={2000}
              placeholder="Paid half now, half on the 15th…"
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
