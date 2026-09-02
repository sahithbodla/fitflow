"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import {
  LeadFormFields,
  type LeadFormDefaults,
} from "@/components/leads/lead-form-fields";
import { updateLeadAction } from "@/lib/actions/leads";
import { idleFormState } from "@/lib/actions/types";
import { withSubmittedValues } from "@/lib/actions/merge-values";

export function EditLeadForm({
  leadId,
  defaults,
}: {
  leadId: string;
  defaults: LeadFormDefaults;
}) {
  const action = updateLeadAction.bind(null, leadId);
  const [state, formAction] = useActionState(action, idleFormState);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <FormAlert state={state} />

      {/* Status has a dedicated control on the detail screen, so it is not
          duplicated in this form. */}
      <LeadFormFields
        key={state.values ? JSON.stringify(state.values) : "initial"}
        defaults={withSubmittedValues(defaults, state)}
        errors={state.fieldErrors ?? {}}
        showStatus={false}
      />

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <SubmitButton className="w-full sm:w-auto">Save changes</SubmitButton>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={`/leads/${leadId}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
