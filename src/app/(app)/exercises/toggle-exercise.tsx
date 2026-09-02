"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleExerciseAction } from "@/lib/actions/workouts";
import { idleFormState } from "@/lib/actions/types";

export function ToggleExerciseButton({
  exerciseId,
  exerciseName,
  active,
}: {
  exerciseId: string;
  exerciseName: string;
  active: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    toggleExerciseAction,
    idleFormState,
  );

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="exerciseId" value={exerciseId} />
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
        <span className="sr-only"> {exerciseName}</span>
      </Button>
    </form>
  );
}
