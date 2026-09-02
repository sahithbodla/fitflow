"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import { loginAction } from "@/lib/actions/auth";
import { idleFormState } from "@/lib/actions/types";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(loginAction, idleFormState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <FormAlert state={state} />

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          placeholder="you@yourgym.com"
        />
        {state.fieldErrors?.email ? (
          <p id="email-error" className="text-destructive text-sm">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby={
            state.fieldErrors?.password ? "password-error" : undefined
          }
          placeholder="••••••••••"
        />
        {state.fieldErrors?.password ? (
          <p id="password-error" className="text-destructive text-sm">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      <SubmitButton size="lg" pendingLabel="Signing in…" className="w-full">
        Sign in
      </SubmitButton>
    </form>
  );
}
