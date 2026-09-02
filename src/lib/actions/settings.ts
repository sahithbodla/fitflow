"use server";

import { revalidatePath } from "next/cache";
import { requireUserOrThrow, UnauthorizedError } from "@/lib/auth/guard";
import { connectToDatabase } from "@/lib/db";
import { BusinessSettings } from "@/models/BusinessSettings";
import { businessSettingsSchema } from "@/lib/validation/settings";
import {
  errorState,
  fieldErrorsFromZod,
  successState,
  type FormState,
} from "@/lib/actions/types";

export async function saveBusinessSettingsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireUserOrThrow();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return errorState("Your session expired. Please sign in again.");
    }
    throw error;
  }

  const parsed = businessSettingsSchema.safeParse({
    businessName: formData.get("businessName"),
    tagline: formData.get("tagline") ?? "",
    logoUrl: formData.get("logoUrl") ?? "",
    primaryColor: formData.get("primaryColor"),
    accentColor: formData.get("accentColor"),
    contactEmail: formData.get("contactEmail") ?? "",
    contactPhone: formData.get("contactPhone") ?? "",
    whatsappNumber: formData.get("whatsappNumber") ?? "",
    instagramHandle: formData.get("instagramHandle") ?? "",
    addressLine: formData.get("addressLine") ?? "",
    city: formData.get("city") ?? "",
    timezone: formData.get("timezone") ?? "Asia/Kolkata",
    currency: formData.get("currency") ?? "INR",
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  try {
    await connectToDatabase();
    await BusinessSettings.findOneAndUpdate(
      { singleton: "business" },
      { $set: parsed.data, $setOnInsert: { singleton: "business" } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  } catch {
    return errorState("Could not save settings. Please try again.");
  }

  revalidatePath("/", "layout");
  return successState("Settings saved.");
}
