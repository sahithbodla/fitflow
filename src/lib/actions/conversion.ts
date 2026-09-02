"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserOrThrow, UnauthorizedError } from "@/lib/auth/guard";
import { connectToDatabase } from "@/lib/db";
import { Lead } from "@/models/Lead";
import { Person } from "@/models/Person";
import { Conversion } from "@/models/Conversion";
import { CoachingClient } from "@/models/CoachingClient";
import { normalizePhone } from "@/lib/leads/phone";
import {
  CONVERSION_TYPE_LABELS,
  type ConversionType,
} from "@/lib/people/constants";
import {
  convertLeadSchema,
  updatePersonSchema,
} from "@/lib/validation/conversion";
import {
  errorState,
  fieldErrorsFromZod,
  formValues,
  successState,
  type FormState,
} from "@/lib/actions/types";

const PERSON_FIELDS = [
  "name",
  "phone",
  "email",
  "instagramHandle",
  "fitnessGoal",
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

/**
 * Converts a lead into a customer.
 *
 * The lead is never deleted: it keeps its history and gains a link to the
 * person it became. Identity data is not duplicated — if the staff member
 * chooses an existing customer, the conversion attaches to them instead of
 * creating a second record for the same human.
 *
 * A `{lead, type}` unique index makes converting the same lead to the same
 * destination twice a no-op rather than a duplicate, even if the confirm button
 * is double-tapped.
 */
export async function convertLeadAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = convertLeadSchema.safeParse({
    leadId: formData.get("leadId"),
    type: formData.get("type"),
    linkPersonId: formData.get("linkPersonId") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return errorState(
      "Please check the details below.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  const { leadId, type, linkPersonId, notes } = parsed.data;
  let personId: string;

  try {
    await connectToDatabase();

    const lead = await Lead.findOne({ _id: leadId, archivedAt: null });
    if (!lead) return errorState("This lead no longer exists.");

    const existing = await Conversion.findOne({ lead: leadId, type })
      .select("person")
      .lean();
    if (existing) {
      // Already converted to this destination — send them to the person
      // rather than creating a second identical record.
      redirect(`/people/${String(existing.person)}`);
    }

    let linkedExistingPerson = false;

    if (linkPersonId) {
      const person = await Person.findOne({
        _id: linkPersonId,
        archivedAt: null,
      }).select("_id");
      if (!person) return errorState("That customer no longer exists.");
      personId = String(person._id);
      linkedExistingPerson = true;
    } else {
      const person = await Person.create({
        name: lead.name,
        phone: lead.phone,
        phoneNormalized: normalizePhone(lead.phone),
        email: lead.email,
        instagramHandle: lead.instagramHandle,
        fitnessGoal: lead.fitnessGoal,
        sourceLeadId: lead._id,
        origin: "lead_conversion",
      });
      personId = String(person._id);
    }

    await Conversion.create({
      lead: lead._id,
      person: personId,
      type,
      convertedAt: new Date(),
      actor: user.name,
      linkedExistingPerson,
      notes,
    });

    // Online coaching gets its engagement record straight away so workouts,
    // diet plans and check-ins have something to attach to.
    if (type === "online_coaching") {
      const alreadyCoaching = await CoachingClient.findOne({
        person: personId,
        archivedAt: null,
      }).select("_id");

      if (!alreadyCoaching) {
        await CoachingClient.create({
          person: personId,
          status: "active",
          startDate: new Date(),
          goal: lead.fitnessGoal,
          sourceLeadId: lead._id,
        });
      }
    }

    lead.set("status", "converted");
    lead.set("convertedAt", new Date());
    lead.activity.push({
      type: "converted",
      message: `Converted to ${CONVERSION_TYPE_LABELS[type as ConversionType]}${
        linkedExistingPerson ? " and linked to an existing customer" : ""
      }.${notes ? ` Note: ${notes}` : ""}`,
      actor: user.name,
      createdAt: new Date(),
    });
    await lead.save();
  } catch (error) {
    // `redirect` throws by design; let it through.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return errorState("Could not convert this lead. Please try again.");
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/people");
  revalidatePath("/dashboard");
  redirect(`/people/${personId}?converted=${type}`);
}

export async function updatePersonAction(
  personId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = updatePersonSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    instagramHandle: formData.get("instagramHandle") ?? "",
    fitnessGoal: formData.get("fitnessGoal") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
      formValues(formData, PERSON_FIELDS),
    );
  }

  try {
    await connectToDatabase();
    const result = await Person.updateOne(
      { _id: personId, archivedAt: null },
      {
        $set: {
          ...parsed.data,
          phoneNormalized: normalizePhone(parsed.data.phone),
        },
      },
    );
    if (result.matchedCount === 0) {
      return errorState("This customer no longer exists.");
    }
  } catch {
    return errorState(
      "Could not save your changes. Please try again.",
      undefined,
      formValues(formData, PERSON_FIELDS),
    );
  }

  revalidatePath(`/people/${personId}`);
  revalidatePath("/people");
  return successState("Customer details updated.");
}
