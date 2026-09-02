"use client";

import { useActionState } from "react";
import { CheckCircle2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/form/field";
import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import { submitPublicLeadAction } from "@/lib/actions/leads";
import { idleFormState } from "@/lib/actions/types";
import {
  LEAD_INTERESTS,
  LEAD_INTEREST_LABELS,
} from "@/lib/leads/constants";
import type { BrandSettings } from "@/lib/settings";
import { telHref } from "@/lib/leads/phone";

const INTEREST_BLURBS: Record<string, string> = {
  gym: "Access to the gym floor",
  personal_training: "One-to-one sessions with a coach",
  online_coaching: "Training and nutrition, remotely",
};

function SuccessPanel({ brand }: { brand: BrandSettings }) {
  return (
    <div className="flex flex-col items-center text-center" role="status">
      <span
        className="mb-5 grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
        aria-hidden
      >
        <CheckCircle2 className="size-7" />
      </span>

      <h1 className="text-2xl font-semibold tracking-tight text-balance">
        Thanks — we&rsquo;ve got your details
      </h1>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm text-pretty">
        Someone from {brand.businessName} will get in touch soon to talk through
        the options that suit your goal. No payment is needed yet.
      </p>

      {brand.contactPhone ? (
        <Button asChild variant="outline" size="lg" className="mt-7 w-full sm:w-auto">
          <a href={`tel:${telHref(brand.contactPhone)}`}>
            <Phone className="size-4" />
            Or call {brand.contactPhone}
          </a>
        </Button>
      ) : null}
    </div>
  );
}

export function PublicLeadForm({ brand }: { brand: BrandSettings }) {
  const [state, formAction] = useActionState(
    submitPublicLeadAction,
    idleFormState,
  );

  if (state.status === "success") return <SuccessPanel brand={brand} />;

  const errors = state.fieldErrors ?? {};
  // React clears the form once the action settles, so anything the visitor
  // typed is restored from the values the action echoed back.
  const submitted = state.values ?? {};

  return (
    <div>
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Tell us about your goal
        </h1>
        <p className="text-muted-foreground mt-2 text-sm text-pretty">
          Three quick questions. We&rsquo;ll call you back — no payment needed.
        </p>
      </div>

      <form
        key={state.values ? JSON.stringify(state.values) : "initial"}
        action={formAction}
        className="space-y-5"
        noValidate
      >
        <FormAlert state={state} />

        <Field id="name" label="Your name" error={errors.name} required>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            autoCapitalize="words"
            required
            maxLength={120}
            defaultValue={submitted.name ?? ""}
            placeholder="Priya Sharma"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
        </Field>

        <Field
          id="phone"
          label="Phone number"
          hint="So we can call or message you back."
          error={errors.phone}
          required
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            maxLength={30}
            defaultValue={submitted.phone ?? ""}
            placeholder="98765 43210"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : "phone-hint"}
          />
        </Field>

        <fieldset className="space-y-2">
          <legend className="text-sm leading-none font-medium">
            What are you interested in?
            <span className="text-destructive" aria-hidden>
              *
            </span>
          </legend>

          <div className="grid gap-2 pt-1">
            {LEAD_INTERESTS.map((interest, index) => (
              <label
                key={interest}
                className="border-input has-checked:border-brand has-checked:bg-brand-soft flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors"
              >
                <input
                  type="radio"
                  name="interestedIn"
                  value={interest}
                  defaultChecked={
                    submitted.interestedIn
                      ? submitted.interestedIn === interest
                      : index === 0
                  }
                  className="accent-brand mt-0.5 size-4 shrink-0"
                  required
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {LEAD_INTEREST_LABELS[interest]}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {INTEREST_BLURBS[interest]}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {errors.interestedIn ? (
            <p className="text-destructive text-xs" role="alert">
              {errors.interestedIn}
            </p>
          ) : null}
        </fieldset>

        <Field
          id="email"
          label="Email"
          hint="Optional."
          error={errors.email}
        >
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            maxLength={200}
            defaultValue={submitted.email ?? ""}
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : "email-hint"}
          />
        </Field>

        <Field
          id="fitnessGoal"
          label="What are you hoping to achieve?"
          hint="Optional — a sentence is plenty."
          error={errors.fitnessGoal}
        >
          <Textarea
            id="fitnessGoal"
            name="fitnessGoal"
            rows={3}
            maxLength={1000}
            defaultValue={submitted.fitnessGoal ?? ""}
            placeholder="Lose weight, build strength, train for an event…"
            aria-describedby="fitnessGoal-hint"
          />
        </Field>

        {/* Honeypot: hidden from users, catches naive bots. */}
        <div aria-hidden className="hidden">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <SubmitButton
          size="lg"
          pendingLabel="Sending…"
          className="w-full"
        >
          Send enquiry
        </SubmitButton>

        <p className="text-muted-foreground text-center text-xs leading-relaxed">
          We&rsquo;ll only use your details to contact you about training at{" "}
          {brand.businessName}.
        </p>
      </form>
    </div>
  );
}
