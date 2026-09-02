"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";
import { SubmitButton } from "@/components/form/submit-button";
import {
  EMPTY_LEAD_DEFAULTS,
  LeadFormFields,
} from "@/components/leads/lead-form-fields";
import { createLeadAction } from "@/lib/actions/leads";
import { idleFormState } from "@/lib/actions/types";
import { withSubmittedValues } from "@/lib/actions/merge-values";

export function NewLeadForm() {
  const [state, formAction] = useActionState(createLeadAction, idleFormState);

  const errors = state.fieldErrors ?? {};
  const duplicateId = errors.__duplicate;

  return (
    <form action={formAction} className="space-y-5" noValidate>

      {duplicateId ? (
        <Alert>
          <TriangleAlert className="size-4" />
          <AlertTitle>This might be a duplicate</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{state.message}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="sm" variant="outline">
                <Link href={`/leads/${duplicateId}`}>Open existing lead</Link>
              </Button>
              {/*
                A submit button contributes its own name/value to the
                submission, so the override travels with the form itself —
                no state to flush and no timing to get wrong.
              */}
              <Button
                type="submit"
                name="allowDuplicate"
                value="yes"
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
              >
                Add as a new lead anyway
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : state.status === "error" && state.message ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <LeadFormFields
        key={state.values ? JSON.stringify(state.values) : "initial"}
        defaults={withSubmittedValues(EMPTY_LEAD_DEFAULTS, state)}
        errors={errors}
      />

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <SubmitButton pendingLabel="Saving…" className="w-full sm:w-auto">
          Save lead
        </SubmitButton>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/leads">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
