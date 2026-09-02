"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserOrThrow, UnauthorizedError } from "@/lib/auth/guard";
import { connectToDatabase } from "@/lib/db";
import { Lead } from "@/models/Lead";
import { getBrandSettings } from "@/lib/settings";
import { normalizePhone } from "@/lib/leads/phone";
import {
  LEAD_INTEREST_LABELS,
  LEAD_STATUS_LABELS,
  type LeadInterest,
  type LeadStatus,
} from "@/lib/leads/constants";
import { findPossibleDuplicates } from "@/lib/leads/queries";
import {
  addNoteSchema,
  leadSchema,
  publicLeadSchema,
  setFollowUpSchema,
  updateStatusSchema,
} from "@/lib/validation/lead";
import {
  errorState,
  fieldErrorsFromZod,
  formValues,
  successState,
  type FormState,
} from "@/lib/actions/types";
import { formatDate } from "@/lib/dates";
import { rateLimit, pruneRateLimiter } from "@/lib/rate-limit";

/** Fields echoed back to a form when validation fails. */
const PUBLIC_LEAD_FIELDS = [
  "name",
  "phone",
  "email",
  "interestedIn",
  "fitnessGoal",
] as const;

const LEAD_FIELDS = [
  "name",
  "phone",
  "email",
  "instagramHandle",
  "fitnessGoal",
  "interestedIn",
  "source",
  "status",
  "followUpDate",
] as const;
import { getRequestIp } from "@/lib/request-ip";

/** Parses a `yyyy-mm-dd` value as midnight in the business timezone. */
async function parseBusinessDate(value: string): Promise<Date | null> {
  if (!value) return null;
  const brand = await getBrandSettings();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    const { zonedDayStart } = await import("@/lib/dates");
    return zonedDayStart(
      Number(match[1]),
      Number(match[2]),
      Number(match[3]),
      brand.timezone,
    );
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function requireStaff() {
  try {
    return await requireUserOrThrow();
  } catch (error) {
    if (error instanceof UnauthorizedError) return null;
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Public enquiry form
// ---------------------------------------------------------------------------

/**
 * Creates a lead from the public form.
 *
 * A visitor can only ever supply their own contact details: `status` is forced
 * to "new" and `source` to "public_form" here, regardless of what was posted.
 */
export async function submitPublicLeadAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = publicLeadSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    interestedIn: formData.get("interestedIn"),
    fitnessGoal: formData.get("fitnessGoal") ?? "",
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    return errorState(
      "Please check the details below.",
      fieldErrorsFromZod(parsed.error),
      formValues(formData, PUBLIC_LEAD_FIELDS),
    );
  }

  // Honeypot: a bot filling every field trips this. Report success so it
  // cannot distinguish a rejection from a real submission.
  if (parsed.data.website) {
    return successState("Thanks — we'll be in touch shortly.");
  }

  pruneRateLimiter();
  const ip = await getRequestIp();
  const limit = rateLimit(`lead:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return errorState(
      "You've sent several enquiries already. Please call us instead, or try again later.",
    );
  }

  try {
    await connectToDatabase();

    const phoneNormalized = normalizePhone(parsed.data.phone);

    // Double-tap protection: the same number within 10 minutes is the same
    // person pressing submit twice, not a second enquiry.
    const recent = await Lead.findOne({
      phoneNormalized,
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
    })
      .select("_id")
      .lean();

    if (recent) {
      return successState("Thanks — we'll be in touch shortly.");
    }

    await Lead.create({
      name: parsed.data.name,
      phone: parsed.data.phone,
      phoneNormalized,
      email: parsed.data.email,
      fitnessGoal: parsed.data.fitnessGoal,
      interestedIn: parsed.data.interestedIn,
      source: "public_form",
      status: "new",
      activity: [
        {
          type: "created",
          message: `Enquiry submitted through the website — interested in ${
            LEAD_INTEREST_LABELS[parsed.data.interestedIn as LeadInterest]
          }.`,
          actor: "Public form",
          createdAt: new Date(),
        },
      ],
    });
  } catch {
    return errorState(
      "Something went wrong sending your enquiry. Please try again or call us.",
      undefined,
      formValues(formData, PUBLIC_LEAD_FIELDS),
    );
  }

  revalidatePath("/leads");
  return successState("Thanks — we'll be in touch shortly.");
}

// ---------------------------------------------------------------------------
// Staff actions
// ---------------------------------------------------------------------------

export async function createLeadAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    instagramHandle: formData.get("instagramHandle") ?? "",
    fitnessGoal: formData.get("fitnessGoal") ?? "",
    interestedIn: formData.get("interestedIn"),
    source: formData.get("source") ?? "manual",
    status: formData.get("status") ?? "new",
    followUpDate: formData.get("followUpDate") ?? "",
    allowDuplicate: formData.get("allowDuplicate") ?? undefined,
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
      formValues(formData, LEAD_FIELDS),
    );
  }

  let newId: string;

  try {
    await connectToDatabase();

    if (parsed.data.allowDuplicate !== "yes") {
      const duplicates = await findPossibleDuplicates(
        parsed.data.phone,
        parsed.data.email,
      );
      if (duplicates.length > 0) {
        const match = duplicates[0];
        return {
          status: "error",
          message: `${match.name} is already in your leads with this ${
            match.phone && normalizePhone(match.phone) === normalizePhone(parsed.data.phone)
              ? "phone number"
              : "email"
          }. Open the existing lead, or confirm below to add anyway.`,
          fieldErrors: { __duplicate: match.id },
          values: formValues(formData, LEAD_FIELDS),
        };
      }
    }

    const followUpDate = await parseBusinessDate(parsed.data.followUpDate);

    const created = await Lead.create({
      name: parsed.data.name,
      phone: parsed.data.phone,
      phoneNormalized: normalizePhone(parsed.data.phone),
      email: parsed.data.email,
      instagramHandle: parsed.data.instagramHandle,
      fitnessGoal: parsed.data.fitnessGoal,
      interestedIn: parsed.data.interestedIn,
      source: parsed.data.source,
      status: parsed.data.status,
      followUpDate,
      activity: [
        {
          type: "created",
          message: `Lead added — interested in ${
            LEAD_INTEREST_LABELS[parsed.data.interestedIn as LeadInterest]
          }.`,
          actor: user.name,
          createdAt: new Date(),
        },
      ],
    });

    newId = String(created._id);
  } catch {
    return errorState(
      "Could not save this lead. Please try again.",
      undefined,
      formValues(formData, LEAD_FIELDS),
    );
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  redirect(`/leads/${newId}`);
}

export async function updateLeadAction(
  leadId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    instagramHandle: formData.get("instagramHandle") ?? "",
    fitnessGoal: formData.get("fitnessGoal") ?? "",
    interestedIn: formData.get("interestedIn"),
    source: formData.get("source") ?? "manual",
    status: formData.get("status") ?? "new",
    followUpDate: formData.get("followUpDate") ?? "",
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
      formValues(formData, LEAD_FIELDS),
    );
  }

  try {
    await connectToDatabase();

    const lead = await Lead.findOne({ _id: leadId, archivedAt: null });
    if (!lead) return errorState("This lead no longer exists.");

    const followUpDate = await parseBusinessDate(parsed.data.followUpDate);

    lead.set({
      name: parsed.data.name,
      phone: parsed.data.phone,
      phoneNormalized: normalizePhone(parsed.data.phone),
      email: parsed.data.email,
      instagramHandle: parsed.data.instagramHandle,
      fitnessGoal: parsed.data.fitnessGoal,
      interestedIn: parsed.data.interestedIn,
      source: parsed.data.source,
      followUpDate,
    });

    lead.activity.push({
      type: "details_updated",
      message: "Lead details updated.",
      actor: user.name,
      createdAt: new Date(),
    });

    await lead.save();
  } catch {
    return errorState(
      "Could not save your changes. Please try again.",
      undefined,
      formValues(formData, LEAD_FIELDS),
    );
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return successState("Lead updated.");
}

export async function updateLeadStatusAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = updateStatusSchema.safeParse({
    leadId: formData.get("leadId"),
    status: formData.get("status"),
  });

  if (!parsed.success) return errorState("That status isn't valid.");

  try {
    await connectToDatabase();

    const lead = await Lead.findOne({
      _id: parsed.data.leadId,
      archivedAt: null,
    });
    if (!lead) return errorState("This lead no longer exists.");

    const previous = lead.status as LeadStatus;
    if (previous === parsed.data.status) return successState();

    lead.set("status", parsed.data.status);
    lead.activity.push({
      type: "status_change",
      message: `Status changed from ${LEAD_STATUS_LABELS[previous]} to ${
        LEAD_STATUS_LABELS[parsed.data.status]
      }.`,
      actor: user.name,
      createdAt: new Date(),
    });

    await lead.save();
  } catch {
    return errorState("Could not change the status. Please try again.");
  }

  revalidatePath(`/leads/${parsed.data.leadId}`);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return successState("Status updated.");
}

export async function setFollowUpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  // The "Clear reminder" button submits its own flag, so clearing does not
  // depend on the date input having been emptied first.
  const clearing = formData.get("clearFollowUp") === "yes";

  const parsed = setFollowUpSchema.safeParse({
    leadId: formData.get("leadId"),
    followUpDate: clearing ? "" : (formData.get("followUpDate") ?? ""),
  });

  if (!parsed.success) {
    return errorState(
      "Please choose a valid date.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  try {
    await connectToDatabase();

    const lead = await Lead.findOne({
      _id: parsed.data.leadId,
      archivedAt: null,
    });
    if (!lead) return errorState("This lead no longer exists.");

    const brand = await getBrandSettings();
    const followUpDate = await parseBusinessDate(parsed.data.followUpDate);

    lead.set("followUpDate", followUpDate);
    lead.activity.push({
      type: followUpDate ? "follow_up_set" : "follow_up_cleared",
      message: followUpDate
        ? `Follow-up set for ${formatDate(followUpDate, brand.timezone)}.`
        : "Follow-up reminder cleared.",
      actor: user.name,
      createdAt: new Date(),
    });

    await lead.save();
  } catch {
    return errorState("Could not set the follow-up. Please try again.");
  }

  revalidatePath(`/leads/${parsed.data.leadId}`);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return successState("Follow-up updated.");
}

export async function addLeadNoteAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = addNoteSchema.safeParse({
    leadId: formData.get("leadId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return errorState(
      "Please write a note first.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  try {
    await connectToDatabase();

    const lead = await Lead.findOne({
      _id: parsed.data.leadId,
      archivedAt: null,
    });
    if (!lead) return errorState("This lead no longer exists.");

    lead.activity.push({
      type: "note",
      message: parsed.data.body,
      actor: user.name,
      createdAt: new Date(),
    });

    await lead.save();
  } catch {
    return errorState("Could not save your note. Please try again.");
  }

  revalidatePath(`/leads/${parsed.data.leadId}`);
  return successState("Note added.");
}

/**
 * Soft-deletes a lead. Historical business data is never hard-deleted, so the
 * record is retained and simply excluded from every query.
 */
export async function archiveLeadAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const leadId = String(formData.get("leadId") ?? "");
  if (!leadId) return errorState("This lead no longer exists.");

  try {
    await connectToDatabase();
    const result = await Lead.updateOne(
      { _id: leadId, archivedAt: null },
      { $set: { archivedAt: new Date() } },
    );
    if (result.matchedCount === 0) {
      return errorState("This lead no longer exists.");
    }
  } catch {
    return errorState("Could not archive this lead. Please try again.");
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  redirect("/leads?archived=1");
}
