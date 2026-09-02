import {
  Schema,
  Types,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { COLLECTIONS } from "@/lib/collections";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from "@/lib/memberships/constants";

/**
 * A manually recorded payment. There is no payment gateway in this MVP —
 * the staff member records money that changed hands elsewhere.
 *
 * Always tied to a person; optionally tied to the membership it paid for, so a
 * membership can show what has been collected against it.
 */
const paymentRecordSchema = new Schema(
  {
    person: {
      type: Types.ObjectId,
      ref: "Person",
      required: true,
      index: true,
    },
    membership: {
      type: Types.ObjectId,
      ref: "Membership",
      default: null,
      index: true,
    },
    amount: { type: Number, required: true, min: 0, max: 10_000_000 },
    currency: { type: String, trim: true, uppercase: true, default: "INR" },
    paymentDate: { type: Date, required: true, index: true },
    method: { type: String, required: true, enum: PAYMENT_METHODS },
    status: {
      type: String,
      required: true,
      enum: PAYMENT_STATUSES,
      default: "paid",
      index: true,
    },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    recordedBy: { type: String, trim: true, maxlength: 120, default: "" },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: COLLECTIONS.payments },
);

paymentRecordSchema.index({ paymentDate: -1 });
paymentRecordSchema.index({ person: 1, paymentDate: -1 });

export type PaymentRecordDoc = InferSchemaType<typeof paymentRecordSchema> & {
  _id: string;
};

export const PaymentRecord: Model<PaymentRecordDoc> =
  (models.PaymentRecord as Model<PaymentRecordDoc>) ??
  model<PaymentRecordDoc>("PaymentRecord", paymentRecordSchema);
