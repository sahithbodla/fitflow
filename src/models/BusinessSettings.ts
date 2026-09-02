import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Single-document collection holding the branding + contact details for the
 * business. Always read/written through `@/lib/settings` so there is exactly one
 * row (`singleton: "business"`).
 */
const businessSettingsSchema = new Schema(
  {
    singleton: {
      type: String,
      required: true,
      unique: true,
      default: "business",
      immutable: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      default: "FitFlow",
    },
    tagline: { type: String, trim: true, maxlength: 200, default: "" },
    logoUrl: { type: String, trim: true, default: "" },
    primaryColor: { type: String, required: true, default: "#2563eb" },
    accentColor: { type: String, required: true, default: "#f97316" },
    contactEmail: { type: String, trim: true, lowercase: true, default: "" },
    contactPhone: { type: String, trim: true, default: "" },
    whatsappNumber: { type: String, trim: true, default: "" },
    instagramHandle: { type: String, trim: true, default: "" },
    addressLine: { type: String, trim: true, maxlength: 300, default: "" },
    city: { type: String, trim: true, maxlength: 120, default: "" },
    timezone: { type: String, trim: true, default: "Asia/Kolkata" },
    currency: { type: String, trim: true, default: "INR" },
  },
  { timestamps: true },
);

export type BusinessSettingsDoc = InferSchemaType<
  typeof businessSettingsSchema
> & { _id: string };

export const BusinessSettings: Model<BusinessSettingsDoc> =
  (models.BusinessSettings as Model<BusinessSettingsDoc>) ??
  model<BusinessSettingsDoc>("BusinessSettings", businessSettingsSchema);
