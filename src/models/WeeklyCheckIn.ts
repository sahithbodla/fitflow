import {
  Schema,
  Types,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { COLLECTIONS } from "@/lib/collections";
import { ADHERENCE_LEVELS, WEIGHT_UNITS } from "@/lib/checkins/constants";

/**
 * A weekly check-in for a coaching client.
 *
 * Recorded by the coach from whatever the client sent them — there is no
 * client-facing portal in this MVP. Every field except the date is optional,
 * because a real check-in is often partial: a weight with no adherence, or
 * questions with no weight.
 */
const weeklyCheckInSchema = new Schema(
  {
    coachingClient: {
      type: Types.ObjectId,
      ref: "CoachingClient",
      required: true,
      index: true,
    },
    checkInDate: { type: Date, required: true, index: true },
    weight: { type: Number, min: 0, max: 1000, default: null },
    weightUnit: { type: String, enum: WEIGHT_UNITS, default: "kg" },
    dietAdherence: {
      type: String,
      enum: [...ADHERENCE_LEVELS, ""],
      default: "",
    },
    workoutAdherence: {
      type: String,
      enum: [...ADHERENCE_LEVELS, ""],
      default: "",
    },
    /** What the client asked. */
    questions: { type: String, trim: true, maxlength: 2000, default: "" },
    /** The coach's own notes — never shown to the client in this MVP. */
    coachNotes: { type: String, trim: true, maxlength: 2000, default: "" },
    recordedBy: { type: String, trim: true, maxlength: 120, default: "" },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: COLLECTIONS.checkIns },
);

weeklyCheckInSchema.index({ coachingClient: 1, checkInDate: -1 });

export type WeeklyCheckInDoc = InferSchemaType<typeof weeklyCheckInSchema> & {
  _id: string;
};

export const WeeklyCheckIn: Model<WeeklyCheckInDoc> =
  (models.WeeklyCheckIn as Model<WeeklyCheckInDoc>) ??
  model<WeeklyCheckInDoc>("WeeklyCheckIn", weeklyCheckInSchema);
