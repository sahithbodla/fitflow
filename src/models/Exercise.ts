import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { COLLECTIONS } from "@/lib/collections";
import { EXERCISE_CATEGORIES } from "@/lib/workouts/constants";

/**
 * A movement in the coach's library.
 *
 * Videos are linked, never uploaded — this MVP has no file storage.
 */
const exerciseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: {
      type: String,
      enum: [...EXERCISE_CATEGORIES, ""],
      default: "",
      index: true,
    },
    instructions: { type: String, trim: true, maxlength: 2000, default: "" },
    externalVideoUrl: { type: String, trim: true, maxlength: 500, default: "" },
    active: { type: Boolean, required: true, default: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: COLLECTIONS.exercises },
);

exerciseSchema.index({ active: 1, name: 1 });

export type ExerciseDoc = InferSchemaType<typeof exerciseSchema> & {
  _id: string;
};

export const Exercise: Model<ExerciseDoc> =
  (models.Exercise as Model<ExerciseDoc>) ??
  model<ExerciseDoc>("Exercise", exerciseSchema);
