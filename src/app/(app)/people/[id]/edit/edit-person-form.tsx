"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
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
import { ConfirmSubmit } from "@/components/form/confirm-submit";
import {
  createPersonAction,
  updatePersonAction,
} from "@/lib/actions/conversion";
import { idleFormState } from "@/lib/actions/types";
import { withSubmittedValues } from "@/lib/actions/merge-values";
import { useFormErrors } from "@/components/form/use-form-errors";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";

export type PersonFormDefaults = {
  name: string;
  phone: string;
  email: string;
  instagramHandle: string;
  fitnessGoal: string;
  notes: string;
};

/**
 * One form for creating and editing a customer.
 *
 * Passing `personId: null` creates; anything else updates. Creating warns when
 * the phone or email already belongs to someone, so identity is not silently
 * duplicated, with an explicit override.
 */
export function EditPersonForm({
  personId,
  defaults,
}: {
  personId: string | null;
  defaults: PersonFormDefaults;
}) {
  const action = personId
    ? updatePersonAction.bind(null, personId)
    : createPersonAction;
  const [state, formAction] = useActionState(action, idleFormState);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  const { errors, handleInput, alertState } = useFormErrors(state);
  const values = withSubmittedValues(defaults, state);
  const duplicateId = state.fieldErrors?.__duplicate;

  return (
    <form
      key={state.values ? JSON.stringify(state.values) : "initial"}
      action={formAction}
      onInput={handleInput}
      className="space-y-5"
      noValidate
    >
      {duplicateId ? (
        <Alert>
          <TriangleAlert className="size-4" />
          <AlertTitle>This might be a duplicate</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{state.message}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="sm" variant="outline">
                <Link href={`/people/${duplicateId}`}>Open existing</Link>
              </Button>
              <Button
                type="submit"
                name="allowDuplicate"
                value="yes"
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
              >
                Add as a separate customer
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <FormAlert state={alertState} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact details</CardTitle>
          <CardDescription>
            Changing these updates the customer record only — the original lead
            keeps what was first entered.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            id="name"
            label="Name"
            error={errors.name}
            required
            className="sm:col-span-2"
          >
            <Input
              id="name"
              name="name"
              defaultValue={values.name}
              required
              maxLength={120}
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
          </Field>

          <Field id="phone" label="Phone" error={errors.phone} required>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              defaultValue={values.phone}
              required
              maxLength={30}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "phone-error" : undefined}
            />
          </Field>

          <Field id="email" label="Email" error={errors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              defaultValue={values.email}
              maxLength={200}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </Field>

          <Field
            id="instagramHandle"
            label="Instagram handle"
            hint="Without the @."
            error={errors.instagramHandle}
            className="sm:col-span-2"
          >
            <Input
              id="instagramHandle"
              name="instagramHandle"
              defaultValue={values.instagramHandle}
              maxLength={60}
              autoCapitalize="none"
              autoCorrect="off"
              aria-describedby="instagramHandle-hint"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field id="fitnessGoal" label="Goal" error={errors.fitnessGoal}>
            <Textarea
              id="fitnessGoal"
              name="fitnessGoal"
              defaultValue={values.fitnessGoal}
              rows={3}
              maxLength={1000}
            />
          </Field>

          <Field
            id="notes"
            label="Internal notes"
            hint="Only visible to staff."
            error={errors.notes}
          >
            <Textarea
              id="notes"
              name="notes"
              defaultValue={values.notes}
              rows={4}
              maxLength={2000}
              aria-describedby="notes-hint"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        {personId ? (
          <SubmitButton className="w-full sm:w-auto">Save changes</SubmitButton>
        ) : (
          <ConfirmSubmit
            title="Add this customer?"
            description="Creates a customer record. You can add memberships and coaching for them afterwards."
            confirmLabel="Add customer"
            pendingLabel="Saving…"
            className="w-full sm:w-auto"
          >
            Add customer
          </ConfirmSubmit>
        )}
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={personId ? `/people/${personId}` : "/people"}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
