"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserOrThrow, UnauthorizedError } from "@/lib/auth/guard";
import { connectToDatabase } from "@/lib/db";
import { MembershipPlan } from "@/models/MembershipPlan";
import { Membership } from "@/models/Membership";
import { PaymentRecord } from "@/models/PaymentRecord";
import { Person } from "@/models/Person";
import { getBrandSettings } from "@/lib/settings";
import { zonedDayStart } from "@/lib/dates";
import {
  endMembershipSchema,
  membershipPlanSchema,
  membershipSchema,
  paymentSchema,
} from "@/lib/validation/membership";
import {
  errorState,
  fieldErrorsFromZod,
  formValues,
  successState,
  type FormState,
} from "@/lib/actions/types";

const PLAN_FIELDS = [
  "name",
  "category",
  "description",
  "defaultDurationDays",
  "defaultPrice",
] as const;

const MEMBERSHIP_FIELDS = [
  "personId",
  "planId",
  "planName",
  "category",
  "purchaseDate",
  "startDate",
  "expiryDate",
  "price",
  "status",
  "notes",
] as const;

const PAYMENT_FIELDS = [
  "personId",
  "membershipId",
  "amount",
  "paymentDate",
  "method",
  "status",
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
 * Parses a `yyyy-mm-dd` form value as midnight in the business timezone.
 *
 * Using `new Date("2026-09-03")` would parse as UTC midnight, which is the
 * previous day for anywhere west of Greenwich — expiry dates would appear to
 * land a day early.
 */
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

function isRedirectError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT"),
  );
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

export async function savePlanAction(
  planId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = membershipPlanSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description") ?? "",
    defaultDurationDays: formData.get("defaultDurationDays") ?? "",
    defaultPrice: formData.get("defaultPrice") ?? "",
    active: formData.get("active") ?? undefined,
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
      formValues(formData, PLAN_FIELDS),
    );
  }

  const data = {
    name: parsed.data.name,
    category: parsed.data.category,
    description: parsed.data.description,
    defaultDurationDays: parsed.data.defaultDurationDays
      ? Number(parsed.data.defaultDurationDays)
      : null,
    defaultPrice: parsed.data.defaultPrice
      ? Number(parsed.data.defaultPrice)
      : null,
    active: parsed.data.active === "on" || parsed.data.active === "yes",
  };

  try {
    await connectToDatabase();

    if (planId) {
      const result = await MembershipPlan.updateOne(
        { _id: planId, archivedAt: null },
        { $set: data },
      );
      if (result.matchedCount === 0) return errorState("This plan no longer exists.");
    } else {
      await MembershipPlan.create(data);
    }
  } catch {
    return errorState(
      "Could not save this plan. Please try again.",
      undefined,
      formValues(formData, PLAN_FIELDS),
    );
  }

  revalidatePath("/plans");
  redirect("/plans");
}

/**
 * Deactivates or reactivates a plan.
 *
 * Plans are never hard-deleted: existing memberships reference them, and their
 * historical price and name must stay resolvable.
 */
export async function togglePlanAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const planId = String(formData.get("planId") ?? "");
  const active = formData.get("active") === "yes";
  if (!planId) return errorState("This plan no longer exists.");

  try {
    await connectToDatabase();
    await MembershipPlan.updateOne(
      { _id: planId, archivedAt: null },
      { $set: { active } },
    );
  } catch {
    return errorState("Could not update this plan. Please try again.");
  }

  revalidatePath("/plans");
  return successState(active ? "Plan reactivated." : "Plan deactivated.");
}

// ---------------------------------------------------------------------------
// Memberships
// ---------------------------------------------------------------------------

export async function createMembershipAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = membershipSchema.safeParse({
    personId: formData.get("personId"),
    planId: formData.get("planId") ?? "",
    planName: formData.get("planName"),
    category: formData.get("category"),
    purchaseDate: formData.get("purchaseDate"),
    startDate: formData.get("startDate"),
    expiryDate: formData.get("expiryDate"),
    price: formData.get("price") ?? "",
    status: formData.get("status") ?? "active",
    notes: formData.get("notes") ?? "",
    renewedFrom: formData.get("renewedFrom") ?? "",
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
      formValues(formData, MEMBERSHIP_FIELDS),
    );
  }

  const [purchaseDate, startDate, expiryDate] = await Promise.all([
    parseBusinessDate(parsed.data.purchaseDate),
    parseBusinessDate(parsed.data.startDate),
    parseBusinessDate(parsed.data.expiryDate),
  ]);

  if (!purchaseDate || !startDate || !expiryDate) {
    return errorState("Please check the dates.", {
      purchaseDate: "Enter a valid date",
    });
  }

  let membershipId: string;

  try {
    await connectToDatabase();

    const person = await Person.findOne({
      _id: parsed.data.personId,
      archivedAt: null,
    }).select("_id");
    if (!person) return errorState("That customer no longer exists.");

    const created = await Membership.create({
      person: person._id,
      plan: parsed.data.planId || null,
      planName: parsed.data.planName,
      category: parsed.data.category,
      purchaseDate,
      startDate,
      expiryDate,
      price: parsed.data.price ? Number(parsed.data.price) : null,
      status: parsed.data.status,
      notes: parsed.data.notes,
      renewedFrom: parsed.data.renewedFrom || null,
      createdBy: user.name,
    });

    membershipId = String(created._id);
  } catch {
    return errorState(
      "Could not save this membership. Please try again.",
      undefined,
      formValues(formData, MEMBERSHIP_FIELDS),
    );
  }

  revalidatePath("/members");
  revalidatePath("/dashboard");
  revalidatePath(`/people/${parsed.data.personId}`);
  redirect(`/memberships/${membershipId}`);
}

export async function updateMembershipAction(
  membershipId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = membershipSchema.safeParse({
    personId: formData.get("personId"),
    planId: formData.get("planId") ?? "",
    planName: formData.get("planName"),
    category: formData.get("category"),
    purchaseDate: formData.get("purchaseDate"),
    startDate: formData.get("startDate"),
    expiryDate: formData.get("expiryDate"),
    price: formData.get("price") ?? "",
    status: formData.get("status") ?? "active",
    notes: formData.get("notes") ?? "",
    renewedFrom: formData.get("renewedFrom") ?? "",
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
      formValues(formData, MEMBERSHIP_FIELDS),
    );
  }

  const [purchaseDate, startDate, expiryDate] = await Promise.all([
    parseBusinessDate(parsed.data.purchaseDate),
    parseBusinessDate(parsed.data.startDate),
    parseBusinessDate(parsed.data.expiryDate),
  ]);

  if (!purchaseDate || !startDate || !expiryDate) {
    return errorState("Please check the dates.");
  }

  try {
    await connectToDatabase();
    const result = await Membership.updateOne(
      { _id: membershipId, archivedAt: null },
      {
        $set: {
          planName: parsed.data.planName,
          category: parsed.data.category,
          purchaseDate,
          startDate,
          expiryDate,
          price: parsed.data.price ? Number(parsed.data.price) : null,
          status: parsed.data.status,
          notes: parsed.data.notes,
        },
      },
    );
    if (result.matchedCount === 0) {
      return errorState("This membership no longer exists.");
    }
  } catch {
    return errorState(
      "Could not save your changes. Please try again.",
      undefined,
      formValues(formData, MEMBERSHIP_FIELDS),
    );
  }

  revalidatePath(`/memberships/${membershipId}`);
  revalidatePath("/members");
  revalidatePath("/dashboard");
  return successState("Membership updated.");
}

/**
 * Ends a membership early.
 *
 * `mode` records who ended it — the member cancelled, or the business
 * terminated them over a disciplinary issue — because that distinction matters
 * when the same person comes back. Dates are left exactly as purchased; ending
 * records a decision, it does not rewrite history.
 */
export async function endMembershipAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = endMembershipSchema.safeParse({
    membershipId: formData.get("membershipId"),
    mode: formData.get("mode"),
    reason: formData.get("reason") ?? "",
  });

  if (!parsed.success) return errorState("Could not end this membership.");

  try {
    await connectToDatabase();
    const result = await Membership.updateOne(
      { _id: parsed.data.membershipId, archivedAt: null },
      {
        $set: {
          status: parsed.data.mode,
          cancelledAt: new Date(),
          cancelledReason: parsed.data.reason,
          endedBy: user.name,
        },
      },
    );
    if (result.matchedCount === 0) {
      return errorState("This membership no longer exists.");
    }
  } catch {
    return errorState("Could not end this membership. Please try again.");
  }

  revalidatePath(`/memberships/${parsed.data.membershipId}`);
  revalidatePath("/members");
  revalidatePath("/dashboard");
  return successState(
    parsed.data.mode === "terminated"
      ? "Membership terminated."
      : "Membership cancelled.",
  );
}

/**
 * Soft-deletes a membership. Historical business data is never hard-deleted —
 * the row is retained and excluded from every query.
 */
export async function deleteMembershipAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const membershipId = String(formData.get("membershipId") ?? "");
  const personId = String(formData.get("personId") ?? "");
  if (!membershipId) return errorState("This membership no longer exists.");

  try {
    await connectToDatabase();
    const result = await Membership.updateOne(
      { _id: membershipId, archivedAt: null },
      { $set: { archivedAt: new Date() } },
    );
    if (result.matchedCount === 0) {
      return errorState("This membership no longer exists.");
    }
  } catch {
    return errorState("Could not delete this membership. Please try again.");
  }

  revalidatePath("/members");
  revalidatePath("/dashboard");
  if (personId) revalidatePath(`/people/${personId}`);
  redirect(personId ? `/people/${personId}` : "/members");
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export async function recordPaymentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = paymentSchema.safeParse({
    personId: formData.get("personId"),
    membershipId: formData.get("membershipId") ?? "",
    amount: formData.get("amount"),
    paymentDate: formData.get("paymentDate"),
    method: formData.get("method"),
    status: formData.get("status") ?? "paid",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
      formValues(formData, PAYMENT_FIELDS),
    );
  }

  const paymentDate = await parseBusinessDate(parsed.data.paymentDate);
  if (!paymentDate) {
    return errorState("Please check the date.", {
      paymentDate: "Enter a valid date",
    });
  }

  try {
    await connectToDatabase();
    const brand = await getBrandSettings();

    const person = await Person.findOne({
      _id: parsed.data.personId,
      archivedAt: null,
    }).select("_id");
    if (!person) return errorState("That customer no longer exists.");

    await PaymentRecord.create({
      person: person._id,
      membership: parsed.data.membershipId || null,
      amount: Number(parsed.data.amount),
      currency: brand.currency,
      paymentDate,
      method: parsed.data.method,
      status: parsed.data.status,
      notes: parsed.data.notes,
      recordedBy: user.name,
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return errorState(
      "Could not record this payment. Please try again.",
      undefined,
      formValues(formData, PAYMENT_FIELDS),
    );
  }

  revalidatePath("/payments");
  revalidatePath(`/payments/${parsed.data.personId}`);
  revalidatePath("/dashboard");
  revalidatePath(`/people/${parsed.data.personId}`);
  if (parsed.data.membershipId) {
    revalidatePath(`/memberships/${parsed.data.membershipId}`);
  }
  return successState("Payment recorded.");
}

export async function updatePaymentAction(
  paymentId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = paymentSchema.safeParse({
    personId: formData.get("personId"),
    membershipId: formData.get("membershipId") ?? "",
    amount: formData.get("amount"),
    paymentDate: formData.get("paymentDate"),
    method: formData.get("method"),
    status: formData.get("status") ?? "paid",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
      formValues(formData, PAYMENT_FIELDS),
    );
  }

  const paymentDate = await parseBusinessDate(parsed.data.paymentDate);
  if (!paymentDate) {
    return errorState("Please check the date.", {
      paymentDate: "Enter a valid date",
    });
  }

  try {
    await connectToDatabase();
    const result = await PaymentRecord.updateOne(
      { _id: paymentId, archivedAt: null },
      {
        $set: {
          membership: parsed.data.membershipId || null,
          amount: Number(parsed.data.amount),
          paymentDate,
          method: parsed.data.method,
          status: parsed.data.status,
          notes: parsed.data.notes,
        },
      },
    );
    if (result.matchedCount === 0) {
      return errorState("This payment no longer exists.");
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return errorState(
      "Could not save this payment. Please try again.",
      undefined,
      formValues(formData, PAYMENT_FIELDS),
    );
  }

  revalidatePath("/payments");
  revalidatePath(`/payments/${parsed.data.personId}`);
  revalidatePath(`/people/${parsed.data.personId}`);
  revalidatePath("/dashboard");
  if (parsed.data.membershipId) {
    revalidatePath(`/memberships/${parsed.data.membershipId}`);
  }
  redirect(`/payments/${parsed.data.personId}`);
}

/** Soft-deletes a payment; financial history is never hard-deleted. */
export async function deletePaymentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const paymentId = String(formData.get("paymentId") ?? "");
  const personId = String(formData.get("personId") ?? "");
  const membershipId = String(formData.get("membershipId") ?? "");
  if (!paymentId) return errorState("This payment no longer exists.");

  try {
    await connectToDatabase();
    const result = await PaymentRecord.updateOne(
      { _id: paymentId, archivedAt: null },
      { $set: { archivedAt: new Date() } },
    );
    if (result.matchedCount === 0) {
      return errorState("This payment no longer exists.");
    }
  } catch {
    return errorState("Could not delete this payment. Please try again.");
  }

  revalidatePath("/payments");
  revalidatePath("/dashboard");
  if (personId) {
    revalidatePath(`/payments/${personId}`);
    revalidatePath(`/people/${personId}`);
  }
  if (membershipId) revalidatePath(`/memberships/${membershipId}`);
  return successState("Payment deleted.");
}
