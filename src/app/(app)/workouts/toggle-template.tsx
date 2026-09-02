"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleWorkoutTemplateAction } from "@/lib/actions/workouts";
import { idleFormState } from "@/lib/actions/types";

export function ToggleTemplateButton({
  templateId,
  templateName,
  active,
}: {
  templateId: string;
  templateName: string;
  active: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    toggleWorkoutTemplateAction,
    idleFormState,
  );

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="templateId" value={templateId} />
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
        <span className="sr-only"> {templateName}</span>
      </Button>
    </form>
  );
}
