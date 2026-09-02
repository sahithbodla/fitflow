"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserOrThrow, UnauthorizedError } from "@/lib/auth/guard";
import { connectToDatabase } from "@/lib/db";
import { CoachingClient } from "@/models/CoachingClient";
import { Person } from "@/models/Person";
import { getBrandSettings } from "@/lib/settings";
import { zonedDayStart } from "@/lib/dates";
import {
  coachingClientSchema,
  coachingStatusSchema,
} from "@/lib/validation/coaching";
import { COACHING_STATUS_LABELS } from "@/lib/people/constants";
import {
  errorState,
  fieldErrorsFromZod,
  formValues,
  successState,
  type FormState,
} from "@/lib/actions/types";

const COACHING_FIELDS = [
  "personId",
  "status",
  "startDate",
  "endDate",
  "goal",
  "notes",
] as const;

async function requireStaff() {
  try {
    return await requireUserOrThrow();
  } catch (error) {
    if (error instanceof UnauthorizedError) return null;
    throw error;
  }
}

async function parseBusinessDate(value: string): Promise<Date | null> {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const brand = await getBrandSettings();
  return zonedDayStart(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    brand.timezone,
  );
}

/**
 * Starts an online coaching engagement for an existing customer.
 *
 * Always attached to a Person, never creating a parallel identity record. A
 * customer who already has a coaching engagement is sent to it rather than
 * getting a second one.
 */
export async function createCoachingClientAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = coachingClientSchema.safeParse({
    personId: formData.get("personId"),
    status: formData.get("status") ?? "active",
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") ?? "",
    goal: formData.get("goal") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
      formValues(formData, COACHING_FIELDS),
    );
  }

  let clientId: string;

  try {
    await connectToDatabase();

    const person = await Person.findOne({
      _id: parsed.data.personId,
      archivedAt: null,
    }).select("_id fitnessGoal");
    if (!person) return errorState("That customer no longer exists.");

    const existing = await CoachingClient.findOne({
      person: person._id,
      archivedAt: null,
    }).select("_id");
    if (existing) {
      redirect(`/coaching/${String(existing._id)}`);
    }

    const [startDate, endDate] = await Promise.all([
      parseBusinessDate(parsed.data.startDate),
      parsed.data.endDate
        ? parseBusinessDate(parsed.data.endDate)
        : Promise.resolve(null),
    ]);
    if (!startDate) return errorState("Please check the start date.");

    const created = await CoachingClient.create({
      person: person._id,
      status: parsed.data.status,
      startDate,
      endDate,
      goal: parsed.data.goal || person.fitnessGoal || "",
      notes: parsed.data.notes,
    });

    clientId = String(created._id);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return errorState(
      "Could not start coaching. Please try again.",
      undefined,
      formValues(formData, COACHING_FIELDS),
    );
  }

  revalidatePath("/coaching");
  revalidatePath("/dashboard");
  revalidatePath(`/people/${parsed.data.personId}`);
  redirect(`/coaching/${clientId}`);
}

export async function updateCoachingClientAction(
  clientId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = coachingClientSchema.safeParse({
    personId: formData.get("personId"),
    status: formData.get("status") ?? "active",
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") ?? "",
    goal: formData.get("goal") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
      formValues(formData, COACHING_FIELDS),
    );
  }

  const [startDate, endDate] = await Promise.all([
    parseBusinessDate(parsed.data.startDate),
    parsed.data.endDate
      ? parseBusinessDate(parsed.data.endDate)
      : Promise.resolve(null),
  ]);
  if (!startDate) return errorState("Please check the start date.");

  try {
    await connectToDatabase();
    const result = await CoachingClient.updateOne(
      { _id: clientId, archivedAt: null },
      {
        $set: {
          status: parsed.data.status,
          startDate,
          endDate,
          goal: parsed.data.goal,
          notes: parsed.data.notes,
        },
      },
    );
    if (result.matchedCount === 0) {
      return errorState("This coaching client no longer exists.");
    }
  } catch {
    return errorState(
      "Could not save your changes. Please try again.",
      undefined,
      formValues(formData, COACHING_FIELDS),
    );
  }

  revalidatePath(`/coaching/${clientId}`);
  revalidatePath("/coaching");
  revalidatePath("/dashboard");
  return successState("Coaching client updated.");
}

export async function updateCoachingStatusAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = coachingStatusSchema.safeParse({
    clientId: formData.get("clientId"),
    status: formData.get("status"),
  });

  if (!parsed.success) return errorState("That status isn't valid.");

  try {
    await connectToDatabase();
    const result = await CoachingClient.updateOne(
      { _id: parsed.data.clientId, archivedAt: null },
      {
        $set: {
          status: parsed.data.status,
          // Ending records when it ended; reopening clears that.
          endDate:
            parsed.data.status === "ended" ? new Date() : null,
        },
      },
    );
    if (result.matchedCount === 0) {
      return errorState("This coaching client no longer exists.");
    }
  } catch {
    return errorState("Could not change the status. Please try again.");
  }

  revalidatePath(`/coaching/${parsed.data.clientId}`);
  revalidatePath("/coaching");
  revalidatePath("/dashboard");
  return successState(
    `Marked ${COACHING_STATUS_LABELS[parsed.data.status].toLowerCase()}.`,
  );
}
