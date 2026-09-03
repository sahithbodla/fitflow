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
import {
  CUSTOM_DURATION,
  DURATION_PRESETS,
  durationForRange,
  expiryFromDuration,
  type DurationValue,
} from "@/lib/memberships/dates";
import { useFormErrors } from "@/components/form/use-form-errors";
import { ConfirmSubmit } from "@/components/form/confirm-submit";

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
  confirm,
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
  /** When set, the submit asks for confirmation first. */
  confirm?: { title: string; description: string; confirmLabel: string };
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
  const [duration, setDuration] = useState<DurationValue>(() =>
    durationForRange(defaults.startDate, defaults.expiryDate),
  );

  const { errors, handleInput, alertState } = useFormErrors(state);
  const values = withSubmittedValues(
    { purchaseDate: defaults.purchaseDate, notes: defaults.notes },
    state,
  );

  const categoryPlans = plans.filter((plan) => plan.category === category);

  const isCustom = duration === CUSTOM_DURATION;

  const applyDuration = (next: DurationValue, from: string) => {
    setDuration(next);
    if (next === CUSTOM_DURATION) return;
    const preset = DURATION_PRESETS.find((option) => option.value === next);
    if (preset && from) setExpiryDate(expiryFromDuration(from, preset.months));
  };

  const changeStartDate = (next: string) => {
    setStartDate(next);
    // A preset length is relative to the start date, so it follows it.
    if (!isCustom) applyDuration(duration, next);
  };

  /**
   * Selecting a plan *suggests* a length and price. Both remain editable — the
   * business explicitly needs per-member dates and pricing.
   */
  const applyPlan = (plan: PlanListItem) => {
    setPlanId(plan.id);
    setPlanName(plan.name);
    if (plan.defaultPrice !== null) setPrice(String(plan.defaultPrice));
    if (plan.defaultDurationDays && startDate) {
      // Snap a plan's day count to the nearest whole-month preset where one
      // matches, so the picker reflects what was actually applied.
      const months = Math.round(plan.defaultDurationDays / 30);
      const preset = DURATION_PRESETS.find(
        (option) => option.months === months,
      );
      if (preset) {
        applyDuration(preset.value, startDate);
      } else {
        setDuration(CUSTOM_DURATION);
        const date = new Date(`${startDate}T00:00:00Z`);
        date.setUTCDate(date.getUTCDate() + plan.defaultDurationDays);
        setExpiryDate(date.toISOString().slice(0, 10));
      }
    }
  };

  return (
    <form
      action={formAction}
      onInput={handleInput}
      className="space-y-5"
      noValidate
    >
      <input type="hidden" name="personId" value={personId} />
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="status" value="active" />
      {renewedFrom ? (
        <input type="hidden" name="renewedFrom" value={renewedFrom} />
      ) : null}

      <FormAlert state={alertState} />

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
            Pick a length and the expiry follows the start date. Choose Custom
            to set it by hand. Expiry is never derived from the purchase date —
            a member can pay today and start next month.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm leading-none font-medium">Length</legend>
            <input type="hidden" name="duration" value={duration} />
            <div className="flex flex-wrap gap-2 pt-1">
              {DURATION_PRESETS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={duration === option.value}
                  onClick={() => applyDuration(option.value, startDate)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    duration === option.value
                      ? "border-brand bg-brand text-brand-foreground"
                      : "hover:bg-accent",
                  )}
                >
                  {option.label}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={isCustom}
                onClick={() => setDuration(CUSTOM_DURATION)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  isCustom
                    ? "border-brand bg-brand text-brand-foreground"
                    : "hover:bg-accent",
                )}
              >
                Custom
              </button>
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-3">
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
              onChange={(event) => changeStartDate(event.target.value)}
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
            hint={isCustom ? undefined : "Set by the length you chose."}
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
              readOnly={!isCustom}
              // Read-only rather than disabled: a disabled input posts no
              // value, and the expiry must always reach the server.
              aria-readonly={!isCustom}
              className={cn(!isCustom && "bg-muted text-muted-foreground")}
              aria-invalid={Boolean(errors.expiryDate)}
              aria-describedby={
                errors.expiryDate ? "expiryDate-error" : "expiryDate-hint"
              }
            />
          </Field>
          </div>

          <p className="text-muted-foreground text-xs">
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
        {confirm ? (
          <ConfirmSubmit
            title={confirm.title}
            description={confirm.description}
            confirmLabel={confirm.confirmLabel}
            pendingLabel="Saving…"
            className="w-full sm:w-auto"
          >
            {submitLabel}
          </ConfirmSubmit>
        ) : (
          <SubmitButton className="w-full sm:w-auto">{submitLabel}</SubmitButton>
        )}
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
