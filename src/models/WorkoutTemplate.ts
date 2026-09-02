import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { COLLECTIONS } from "@/lib/collections";
import { WORKOUT_GOALS } from "@/lib/workouts/constants";
import { workoutDaySchema } from "@/models/workout-shared";

/**
 * A reusable workout the coach can assign to clients.
 *
 * Assigning copies the days into a ClientWorkoutPlan rather than referencing
 * them, so customising one client's plan can never change the template or any
 * other client's plan.
 */
const workoutTemplateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    goal: { type: String, enum: [...WORKOUT_GOALS, ""], default: "" },
    days: { type: [workoutDaySchema], default: [] },
    active: { type: Boolean, required: true, default: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: COLLECTIONS.workoutTemplates },
);

workoutTemplateSchema.index({ active: 1, name: 1 });

export type WorkoutTemplateDoc = InferSchemaType<
  typeof workoutTemplateSchema
> & { _id: string };

export const WorkoutTemplate: Model<WorkoutTemplateDoc> =
  (models.WorkoutTemplate as Model<WorkoutTemplateDoc>) ??
  model<WorkoutTemplateDoc>("WorkoutTemplate", workoutTemplateSchema);
