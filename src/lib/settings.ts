import "server-only";
import { cache } from "react";
import { connectToDatabase } from "@/lib/db";
import { BusinessSettings } from "@/models/BusinessSettings";

export type BrandSettings = {
  businessName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  instagramHandle: string;
  addressLine: string;
  city: string;
  timezone: string;
  currency: string;
};

export const DEFAULT_BRAND: BrandSettings = {
  businessName: "FitFlow",
  tagline: "Train with intent. Track everything that matters.",
  logoUrl: "",
  primaryColor: "#2563eb",
  accentColor: "#f97316",
  contactEmail: "",
  contactPhone: "",
  whatsappNumber: "",
  instagramHandle: "",
  addressLine: "",
  city: "",
  timezone: "Asia/Kolkata",
  currency: "INR",
};

/**
 * Reads the singleton settings document. Falls back to defaults when the
 * database is unreachable or not yet seeded, so public pages never hard-fail on
 * branding alone. Memoized per request via React `cache`.
 */
export const getBrandSettings = cache(async (): Promise<BrandSettings> => {
  try {
    await connectToDatabase();
    const doc = await BusinessSettings.findOne({ singleton: "business" }).lean();
    if (!doc) return DEFAULT_BRAND;

    return {
      businessName: doc.businessName || DEFAULT_BRAND.businessName,
      tagline: doc.tagline ?? "",
      logoUrl: doc.logoUrl ?? "",
      primaryColor: doc.primaryColor || DEFAULT_BRAND.primaryColor,
      accentColor: doc.accentColor || DEFAULT_BRAND.accentColor,
      contactEmail: doc.contactEmail ?? "",
      contactPhone: doc.contactPhone ?? "",
      whatsappNumber: doc.whatsappNumber ?? "",
      instagramHandle: doc.instagramHandle ?? "",
      addressLine: doc.addressLine ?? "",
      city: doc.city ?? "",
      timezone: doc.timezone || DEFAULT_BRAND.timezone,
      currency: doc.currency || DEFAULT_BRAND.currency,
    };
  } catch {
    return DEFAULT_BRAND;
  }
});

/** Creates the settings row on first use so the settings form always has a target. */
export async function ensureBrandSettings() {
  await connectToDatabase();
  return BusinessSettings.findOneAndUpdate(
    { singleton: "business" },
    { $setOnInsert: { singleton: "business" } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
}
