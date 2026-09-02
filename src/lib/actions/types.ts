/** Shared shape for `useActionState`-driven forms. */
export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
  /**
   * What the user submitted, echoed back on error.
   *
   * React resets an uncontrolled form once its action settles, so without this
   * a validation error would wipe everything the user typed. Forms merge these
   * over their defaults when re-rendering.
   */
  values?: Record<string, string>;
};

export const idleFormState: FormState = { status: "idle" };

export function errorState(
  message: string,
  fieldErrors?: Record<string, string>,
  values?: Record<string, string>,
): FormState {
  return { status: "error", message, fieldErrors, values };
}

/** Collects the named string entries of a submission for echoing back. */
export function formValues(
  formData: FormData,
  keys: readonly string[],
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

export function successState(message?: string): FormState {
  return { status: "success", message };
}

import type { ZodError } from "zod";

/** Flattens a Zod error into `{ fieldName: firstMessage }`. */
export function fieldErrorsFromZod(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".");
    if (key && !result[key]) result[key] = issue.message;
  }
  return result;
}
