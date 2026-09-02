import {
  Schema,
  Types,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { COLLECTIONS } from "@/lib/collections";
import { CONVERSION_TYPES } from "@/lib/people/constants";

/**
 * Audit record of a lead becoming a customer.
 *
 * Deliberately append-only: one row per conversion event, never updated. A
 * person may convert more than once (a gym member who later takes up online
 * coaching), and each of those is its own row.
 */
const conversionSchema = new Schema(
  {
    lead: { type: Types.ObjectId, ref: "Lead", required: true, index: true },
    person: {
      type: Types.ObjectId,
      ref: "Person",
      required: true,
      index: true,
    },
    type: { type: String, required: true, enum: CONVERSION_TYPES },
    convertedAt: { type: Date, required: true, default: () => new Date() },
    /** Display name of the staff member who performed the conversion. */
    actor: { type: String, required: true, trim: true, maxlength: 120 },
    /** True when an existing Person was reused rather than a new one created. */
    linkedExistingPerson: { type: Boolean, required: true, default: false },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
  },
  { timestamps: true, collection: COLLECTIONS.conversions },
);

conversionSchema.index({ convertedAt: -1 });
conversionSchema.index({ lead: 1, type: 1 }, { unique: true });

export type ConversionDoc = InferSchemaType<typeof conversionSchema> & {
  _id: string;
};

export const Conversion: Model<ConversionDoc> =
  (models.Conversion as Model<ConversionDoc>) ??
  model<ConversionDoc>("Conversion", conversionSchema);
