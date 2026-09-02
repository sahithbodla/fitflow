import { Schema, Types } from "mongoose";

/**
 * One prescribed exercise inside a workout day.
 *
 * `exerciseName` and `videoUrl` are snapshots taken when the exercise was
 * added. A template or a client's plan must keep showing what was prescribed
 * even if the library entry is later renamed, re-linked or deactivated. The
 * `exercise` reference is kept only so the library can be revisited.
 */
export const workoutExerciseSchema = new Schema(
  {
    exercise: { type: Types.ObjectId, ref: "Exercise", default: null },
    exerciseName: { type: String, required: true, trim: true, maxlength: 120 },
    videoUrl: { type: String, trim: true, maxlength: 500, default: "" },
    sets: { type: String, trim: true, maxlength: 40, default: "" },
    reps: { type: String, trim: true, maxlength: 40, default: "" },
    rest: { type: String, trim: true, maxlength: 40, default: "" },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: true },
);

/** One training day within a workout. */
export const workoutDaySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    notes: { type: String, trim: true, maxlength: 500, default: "" },
    exercises: { type: [workoutExerciseSchema], default: [] },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: true },
);
