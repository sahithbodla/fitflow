import { Alert, AlertDescription } from "@/components/ui/alert";
import type { FormState } from "@/lib/actions/types";

/** Renders the form-level error message, if any. */
export function FormAlert({ state }: { state: FormState }) {
  if (state.status !== "error" || !state.message) return null;
  return (
    <Alert variant="destructive" role="alert">
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}
