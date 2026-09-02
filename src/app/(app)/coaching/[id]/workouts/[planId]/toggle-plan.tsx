"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleClientPlanAction } from "@/lib/actions/workouts";
import { idleFormState } from "@/lib/actions/types";

export function TogglePlanButton({
  planId,
  clientId,
  active,
}: {
  planId: string;
  clientId: string;
  active: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    toggleClientPlanAction,
    idleFormState,
  );

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="clientId" value={clientId} />
      <Button
        type="submit"
        name="active"
        value={active ? "no" : "yes"}
        variant="outline"
        size="sm"
        disabled={isPending}
      >
        {active ? "Archive plan" : "Set as active"}
      </Button>
    </form>
  );
}
