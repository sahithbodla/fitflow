"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserOrThrow, UnauthorizedError } from "@/lib/auth/guard";
import { connectToDatabase } from "@/lib/db";
import { WeeklyCheckIn } from "@/models/WeeklyCheckIn";
import { CoachingClient } from "@/models/CoachingClient";
import { getBrandSettings } from "@/lib/settings";
import { zonedDayStart } from "@/lib/dates";
import { checkInSchema } from "@/lib/validation/checkin";
import {
  errorState,
  fieldErrorsFromZod,
  formValues,
  successState,
  type FormState,
} from "@/lib/actions/types";
import { recordAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

const CHECKIN_FIELDS = [
  "checkInDate",
  "weight",
  "weightUnit",
  "dietAdherence",
  "workoutAdherence",
  "questions",
  "coachNotes",
] as const;

async function requireStaff() {
  try {
    return await requireUserOrThrow();
  } catch (error) {
    if (error instanceof UnauthorizedError) return null;
    throw error;
  }
}

function isRedirectError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT"),
  );
}

/**
 * Records or updates a weekly check-in.
 *
 * Everything except the date is optional: a real check-in is often partial,
 * and a missing weight must stay missing rather than becoming zero.
 */
export async function saveCheckInAction(
  checkInId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = checkInSchema.safeParse({
    coachingClientId: formData.get("coachingClientId"),
    checkInDate: formData.get("checkInDate"),
    weight: formData.get("weight") ?? "",
    weightUnit: formData.get("weightUnit") ?? "kg",
    dietAdherence: formData.get("dietAdherence") ?? "",
    workoutAdherence: formData.get("workoutAdherence") ?? "",
    questions: formData.get("questions") ?? "",
    coachNotes: formData.get("coachNotes") ?? "",
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
      formValues(formData, CHECKIN_FIELDS),
    );
  }

  const clientId = parsed.data.coachingClientId;

  try {
    await connectToDatabase();

    const client = await CoachingClient.findOne({
      _id: clientId,
      archivedAt: null,
    }).select("_id");
    if (!client) return errorState("That coaching client no longer exists.");

    const brand = await getBrandSettings();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(parsed.data.checkInDate);
    if (!match) return errorState("Please check the date.");
    const checkInDate = zonedDayStart(
      Number(match[1]),
      Number(match[2]),
      Number(match[3]),
      brand.timezone,
    );

    const data = {
      checkInDate,
      weight: parsed.data.weight === "" ? null : Number(parsed.data.weight),
      weightUnit: parsed.data.weightUnit,
      dietAdherence: parsed.data.dietAdherence,
      workoutAdherence: parsed.data.workoutAdherence,
      questions: parsed.data.questions,
      coachNotes: parsed.data.coachNotes,
    };

    if (checkInId) {
      const result = await WeeklyCheckIn.updateOne(
        { _id: checkInId, archivedAt: null },
        { $set: data },
      );
      if (result.matchedCount === 0) {
        return errorState("This check-in no longer exists.");
      }
    } else {
      const created = await WeeklyCheckIn.create({
        ...data,
        coachingClient: client._id,
        recordedBy: user.name,
      });

      await recordAudit({
        actorUserId: user.id,
        action: "CHECKIN_CREATED",
        entityType: "checkIn",
        entityId: String(created._id),
        metadata: { weight: data.weight, weightUnit: data.weightUnit },
      });
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    logger.error("saveCheckInAction failed", error, { clientId, checkInId });
    return errorState(
      "Could not save this check-in. Please try again.",
      undefined,
      formValues(formData, CHECKIN_FIELDS),
    );
  }

  revalidatePath(`/coaching/${clientId}`);
  revalidatePath("/dashboard");

  if (checkInId) {
    redirect(`/coaching/${clientId}?tab=check-ins`);
  }
  return successState("Check-in recorded.");
}

/** Soft-deletes a check-in; progress history is never hard-deleted. */
export async function archiveCheckInAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const checkInId = String(formData.get("checkInId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  if (!checkInId) return errorState("This check-in no longer exists.");

  try {
    await connectToDatabase();
    await WeeklyCheckIn.updateOne(
      { _id: checkInId, archivedAt: null },
      { $set: { archivedAt: new Date() } },
    );
  } catch {
    return errorState("Could not remove this check-in. Please try again.");
  }

  revalidatePath(`/coaching/${clientId}`);
  revalidatePath("/dashboard");
  return successState("Check-in removed.");
}
