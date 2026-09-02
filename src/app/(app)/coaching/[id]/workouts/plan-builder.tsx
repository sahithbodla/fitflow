"use client";

import {
  WorkoutBuilder,
  type BuilderActions,
} from "@/components/workouts/workout-builder";
import {
  addWorkoutDayAction,
  addWorkoutExerciseAction,
  removeWorkoutDayAction,
  removeWorkoutExerciseAction,
  updateWorkoutDayAction,
  updateWorkoutExerciseAction,
} from "@/lib/actions/workouts";
import type { ExerciseItem, WorkoutDayItem } from "@/lib/workouts/queries";

/**
 * Binds the shared builder actions to one client's plan.
 *
 * The `"plan"` kind routes every edit to the ClientWorkoutPlan collection, so
 * nothing here can reach the template the plan was copied from.
 */
export function PlanBuilder({
  planId,
  clientId,
  days,
  library,
  readOnlyNotice,
}: {
  planId: string;
  clientId: string;
  days: WorkoutDayItem[];
  library: ExerciseItem[];
  readOnlyNotice?: string;
}) {
  const actions: BuilderActions = {
    addDay: addWorkoutDayAction.bind(null, "plan", planId, clientId),
    updateDay: updateWorkoutDayAction.bind(null, "plan", planId, clientId),
    removeDay: removeWorkoutDayAction.bind(null, "plan", planId, clientId),
    addExercise: addWorkoutExerciseAction.bind(null, "plan", planId, clientId),
    updateExercise: updateWorkoutExerciseAction.bind(
      null,
      "plan",
      planId,
      clientId,
    ),
    removeExercise: removeWorkoutExerciseAction.bind(
      null,
      "plan",
      planId,
      clientId,
    ),
  };

  return (
    <WorkoutBuilder
      days={days}
      library={library}
      actions={actions}
      readOnlyNotice={readOnlyNotice}
    />
  );
}
