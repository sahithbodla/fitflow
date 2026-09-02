import {
  Schema,
  Types,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { COLLECTIONS } from "@/lib/collections";
import { COACHING_STATUSES } from "@/lib/people/constants";

/**
 * An online coaching engagement for a person.
 *
 * Created at conversion; workouts, diet plans and weekly check-ins attach to it
 * in later phases.
 */
const coachingClientSchema = new Schema(
  {
    person: {
      type: Types.ObjectId,
      ref: "Person",
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: COACHING_STATUSES,
      default: "active",
      index: true,
    },
    startDate: { type: Date, required: true, default: () => new Date() },
    endDate: { type: Date, default: null },
    goal: { type: String, trim: true, maxlength: 1000, default: "" },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    sourceLeadId: { type: Types.ObjectId, ref: "Lead", default: null },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: COLLECTIONS.coachingClients },
);

coachingClientSchema.index({ status: 1, startDate: -1 });

export type CoachingClientDoc = InferSchemaType<typeof coachingClientSchema> & {
  _id: string;
};

export const CoachingClient: Model<CoachingClientDoc> =
  (models.CoachingClient as Model<CoachingClientDoc>) ??
  model<CoachingClientDoc>("CoachingClient", coachingClientSchema);
