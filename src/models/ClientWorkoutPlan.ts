import {
  Schema,
  Types,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { COLLECTIONS } from "@/lib/collections";
import { WORKOUT_GOALS } from "@/lib/workouts/constants";
import { workoutDaySchema } from "@/models/workout-shared";

/**
 * A workout plan belonging to one coaching client.
 *
 * When created from a template the days are deep-copied, never referenced.
 * `sourceTemplate` and `sourceTemplateName` record where it came from purely
 * for display — editing this plan never touches the template.
 */
const clientWorkoutPlanSchema = new Schema(
  {
    coachingClient: {
      type: Types.ObjectId,
      ref: "CoachingClient",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    goal: { type: String, enum: [...WORKOUT_GOALS, ""], default: "" },
    days: { type: [workoutDaySchema], default: [] },
    sourceTemplate: {
      type: Types.ObjectId,
      ref: "WorkoutTemplate",
      default: null,
    },
    sourceTemplateName: { type: String, trim: true, maxlength: 120, default: "" },
    /** True once the coach edits a plan that came from a template. */
    customised: { type: Boolean, required: true, default: false },
    startDate: { type: Date, required: true, default: () => new Date() },
    active: { type: Boolean, required: true, default: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: COLLECTIONS.clientWorkoutPlans },
);

clientWorkoutPlanSchema.index({ coachingClient: 1, active: -1, startDate: -1 });

export type ClientWorkoutPlanDoc = InferSchemaType<
  typeof clientWorkoutPlanSchema
> & { _id: string };

export const ClientWorkoutPlan: Model<ClientWorkoutPlanDoc> =
  (models.ClientWorkoutPlan as Model<ClientWorkoutPlanDoc>) ??
  model<ClientWorkoutPlanDoc>("ClientWorkoutPlan", clientWorkoutPlanSchema);
