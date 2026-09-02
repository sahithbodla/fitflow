"use client";

import {
  WorkoutDetailsForm,
  type WorkoutDetailsDefaults,
} from "@/components/workouts/workout-details-form";
import { updateClientPlanDetailsAction } from "@/lib/actions/workouts";

export function EditPlanDetailsForm({
  planId,
  clientId,
  defaults,
}: {
  planId: string;
  clientId: string;
  defaults: WorkoutDetailsDefaults;
}) {
  const action = updateClientPlanDetailsAction.bind(null, planId, clientId);

  return (
    <WorkoutDetailsForm
      action={action}
      submitLabel="Save changes"
      cancelHref={`/coaching/${clientId}/workouts/${planId}`}
      description="Days and exercises are edited on the plan page."
      defaults={defaults}
    />
  );
}
