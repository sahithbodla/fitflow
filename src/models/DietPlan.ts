import {
  Schema,
  Types,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { COLLECTIONS } from "@/lib/collections";
import { DIET_GOALS } from "@/lib/diet/constants";

/** One food entry within a meal. Quantities are free text — "1 cup", "150g". */
const dietItemSchema = new Schema(
  {
    food: { type: String, required: true, trim: true, maxlength: 160 },
    quantity: { type: String, trim: true, maxlength: 80, default: "" },
    notes: { type: String, trim: true, maxlength: 300, default: "" },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: true },
);

/** A meal section — Breakfast, Post-workout, and so on. */
const dietMealSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    time: { type: String, trim: true, maxlength: 40, default: "" },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    items: { type: [dietItemSchema], default: [] },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: true },
);

/**
 * A diet plan for one coaching client.
 *
 * Targets are values the coach types in — nothing is calculated, and no
 * nutritional analysis is performed or implied. Superseded plans are marked
 * inactive rather than deleted, so the history of what a client was given is
 * preserved.
 */
const dietPlanSchema = new Schema(
  {
    coachingClient: {
      type: Types.ObjectId,
      ref: "CoachingClient",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    goal: { type: String, enum: [...DIET_GOALS, ""], default: "" },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    /** Coach-entered targets. Optional and never computed. */
    calorieTarget: { type: Number, min: 0, max: 20000, default: null },
    proteinTarget: { type: Number, min: 0, max: 2000, default: null },
    carbTarget: { type: Number, min: 0, max: 2000, default: null },
    fatTarget: { type: Number, min: 0, max: 2000, default: null },
    meals: { type: [dietMealSchema], default: [] },
    startDate: { type: Date, required: true, default: () => new Date() },
    active: { type: Boolean, required: true, default: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: COLLECTIONS.dietPlans },
);

dietPlanSchema.index({ coachingClient: 1, active: -1, startDate: -1 });

export type DietPlanDoc = InferSchemaType<typeof dietPlanSchema> & {
  _id: string;
};

export const DietPlan: Model<DietPlanDoc> =
  (models.DietPlan as Model<DietPlanDoc>) ??
  model<DietPlanDoc>("DietPlan", dietPlanSchema);
