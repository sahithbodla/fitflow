"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/form/field";
import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import { idleFormState } from "@/lib/actions/types";
import {
  changePasswordAction,
  updateProfileAction,
} from "@/lib/actions/account";
import type { CurrentUser } from "@/lib/auth/guard";

export function ProfileForm({ user }: { user: CurrentUser }) {
  const [state, formAction] = useActionState(updateProfileAction, idleFormState);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your details</CardTitle>
          <CardDescription>
            Your name appears on this dashboard. Your email is how you sign in.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <FormAlert state={state} />

          <Field id="name" label="Name" error={errors.name} required>
            <Input
              id="name"
              name="name"
              defaultValue={user.name}
              required
              maxLength={120}
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
          </Field>

          <Field id="email" label="Email" error={errors.email} required>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              defaultValue={user.email}
              required
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </Field>
        </CardContent>

        <CardFooter>
          <SubmitButton className="w-full sm:w-auto">Save details</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState(
    changePasswordAction,
    idleFormState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success" && state.message) {
      toast.success(state.message);
      formRef.current?.reset();
    }
  }, [state]);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} ref={formRef} noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change password</CardTitle>
          <CardDescription>
            Use at least 10 characters. You stay signed in on this device.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <FormAlert state={state} />

          <Field
            id="currentPassword"
            label="Current password"
            error={errors.currentPassword}
            required
          >
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={Boolean(errors.currentPassword)}
              aria-describedby={
                errors.currentPassword ? "currentPassword-error" : undefined
              }
            />
          </Field>

          <Field
            id="newPassword"
            label="New password"
            hint="At least 10 characters."
            error={errors.newPassword}
            required
          >
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
              aria-invalid={Boolean(errors.newPassword)}
              aria-describedby={
                errors.newPassword ? "newPassword-error" : "newPassword-hint"
              }
            />
          </Field>

          <Field
            id="confirmPassword"
            label="Confirm new password"
            error={errors.confirmPassword}
            required
          >
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword ? "confirmPassword-error" : undefined
              }
            />
          </Field>
        </CardContent>

        <CardFooter>
          <SubmitButton pendingLabel="Changing…" className="w-full sm:w-auto">
            Change password
          </SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
