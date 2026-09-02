"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { togglePlanAction } from "@/lib/actions/memberships";
import { idleFormState } from "@/lib/actions/types";

/** Deactivating hides a plan from new memberships without touching history. */
export function TogglePlanButton({
  planId,
  planName,
  active,
}: {
  planId: string;
  planName: string;
  active: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    togglePlanAction,
    idleFormState,
  );

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="ml-auto">
      <input type="hidden" name="planId" value={planId} />
      <Button
        type="submit"
        name="active"
        value={active ? "no" : "yes"}
        variant="ghost"
        size="sm"
        disabled={isPending}
        className="text-muted-foreground"
      >
        {active ? "Deactivate" : "Reactivate"}
        <span className="sr-only"> {planName}</span>
      </Button>
    </form>
  );
}
