"use client";

import { useCallback, useState } from "react";
import type { FormState } from "@/lib/actions/types";

/**
 * Server-side validation errors that clear as soon as the user fixes them.
 *
 * Without this, an error stays on screen while the user retypes the field and
 * only disappears on the next submit — so the form keeps telling them off for
 * something they have already corrected.
 *
 * `handleInput` is attached once to the `<form>` and relies on input events
 * bubbling, so every current and future field is covered without wiring each
 * one up individually.
 */
export function useFormErrors(state: FormState) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [alertDismissed, setAlertDismissed] = useState(false);

  // A new submission produces a new state object; reset dismissals so the
  // fresh errors are shown.
  const [lastState, setLastState] = useState(state);
  if (lastState !== state) {
    setLastState(state);
    setDismissed(new Set());
    setAlertDismissed(false);
  }

  const handleInput = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    const target = event.target as HTMLElement & { name?: string };
    if (!target?.name) return;
    setDismissed((current) => {
      if (current.has(target.name!)) return current;
      const next = new Set(current);
      next.add(target.name!);
      return next;
    });
    // The summary at the top refers to the same fields, so it goes too.
    setAlertDismissed(true);
  }, []);

  const source = state.fieldErrors ?? {};
  const errors: Record<string, string> = {};
  for (const [field, message] of Object.entries(source)) {
    if (!dismissed.has(field)) errors[field] = message;
  }

  return {
    errors,
    /** Attach to the `<form>`: `onInput={handleInput}`. */
    handleInput,
    /** The form-level message, hidden once the user starts correcting. */
    alertState: alertDismissed ? { status: "idle" as const } : state,
  };
}
