/** Shared shape for `useActionState`-driven forms. */
export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export const idleFormState: FormState = { status: "idle" };

export function errorState(
  message: string,
  fieldErrors?: Record<string, string>,
): FormState {
  return { status: "error", message, fieldErrors };
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
