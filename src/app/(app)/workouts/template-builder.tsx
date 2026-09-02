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

/** Binds the shared builder actions to a workout template. */
export function TemplateBuilder({
  templateId,
  days,
  library,
}: {
  templateId: string;
  days: WorkoutDayItem[];
  library: ExerciseItem[];
}) {
  const actions: BuilderActions = {
    addDay: addWorkoutDayAction.bind(null, "template", templateId, ""),
    updateDay: updateWorkoutDayAction.bind(null, "template", templateId, ""),
    removeDay: removeWorkoutDayAction.bind(null, "template", templateId, ""),
    addExercise: addWorkoutExerciseAction.bind(null, "template", templateId, ""),
    updateExercise: updateWorkoutExerciseAction.bind(
      null,
      "template",
      templateId,
      "",
    ),
    removeExercise: removeWorkoutExerciseAction.bind(
      null,
      "template",
      templateId,
      "",
    ),
  };

  return <WorkoutBuilder days={days} library={library} actions={actions} />;
}
