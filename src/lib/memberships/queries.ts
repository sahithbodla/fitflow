import "server-only";
import type { QueryFilter } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import {
  MembershipPlan,
  type MembershipPlanDoc,
} from "@/models/MembershipPlan";
import { Membership, type MembershipDoc } from "@/models/Membership";
import {
  PaymentRecord,
  type PaymentRecordDoc,
} from "@/models/PaymentRecord";
import { Person, type PersonDoc } from "@/models/Person";
import { normalizePhone } from "@/lib/leads/phone";
import { startOfDayFromToday, startOfToday } from "@/lib/dates";
import { effectiveStatus } from "@/lib/memberships/status";
import {
  EXPIRING_SOON_DAYS,
  type EffectiveStatus,
  type MembershipCategory,
  type MembershipStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/memberships/constants";
import type { MemberFilterInput } from "@/lib/validation/membership";

export const MEMBERS_PAGE_SIZE = 20;
export const PAYMENTS_PAGE_SIZE = 25;

export type PlanListItem = {
  id: string;
  name: string;
  category: MembershipCategory;
  description: string;
  defaultDurationDays: number | null;
  defaultPrice: number | null;
  active: boolean;
  /** How many memberships were sold on this plan. Blocks silent data loss. */
  membershipCount: number;
};

export type MembershipListItem = {
  id: string;
  personId: string;
  personName: string;
  personPhone: string;
  planName: string;
  category: MembershipCategory;
  purchaseDate: string;
  startDate: string;
  expiryDate: string;
  price: number | null;
  status: MembershipStatus;
  effective: EffectiveStatus;
  renewedFrom: string | null;
};

export type PaymentListItem = {
  id: string;
  personId: string;
  personName: string;
  membershipId: string | null;
  membershipLabel: string | null;
  amount: number;
  currency: string;
  paymentDate: string;
  method: PaymentMethod;
  status: PaymentStatus;
  notes: string;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

export async function listPlans(): Promise<PlanListItem[]> {
  await connectToDatabase();

  const docs = await MembershipPlan.find({ archivedAt: null })
    .sort({ category: 1, active: -1, name: 1 })
    .lean<MembershipPlanDoc[]>();

  const counts = await Membership.aggregate<{ _id: string; count: number }>([
    { $match: { plan: { $ne: null }, archivedAt: null } },
    { $group: { _id: "$plan", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((row) => [String(row._id), row.count]));

  return docs.map((doc) => ({
    id: String(doc._id),
    name: doc.name,
    category: doc.category as MembershipCategory,
    description: doc.description ?? "",
    defaultDurationDays: doc.defaultDurationDays ?? null,
    defaultPrice: doc.defaultPrice ?? null,
    active: doc.active,
    membershipCount: countMap.get(String(doc._id)) ?? 0,
  }));
}

export async function getPlan(id: string): Promise<PlanListItem | null> {
  await connectToDatabase();
  if (!/^[a-f\d]{24}$/i.test(id)) return null;

  const doc = await MembershipPlan.findOne({
    _id: id,
    archivedAt: null,
  }).lean<MembershipPlanDoc>();
  if (!doc) return null;

  const membershipCount = await Membership.countDocuments({
    plan: id,
    archivedAt: null,
  });

  return {
    id: String(doc._id),
    name: doc.name,
    category: doc.category as MembershipCategory,
    description: doc.description ?? "",
    defaultDurationDays: doc.defaultDurationDays ?? null,
    defaultPrice: doc.defaultPrice ?? null,
    active: doc.active,
    membershipCount,
  };
}

/** Active plans only — what the membership form offers. */
export async function listActivePlans(): Promise<PlanListItem[]> {
  const plans = await listPlans();
  return plans.filter((plan) => plan.active);
}

// ---------------------------------------------------------------------------
// Memberships
// ---------------------------------------------------------------------------

type PopulatedPerson = { _id: unknown; name: string; phone: string };

function toMembershipListItem(
  doc: Omit<MembershipDoc, "person"> & { person: unknown },
  timeZone: string,
): MembershipListItem {
  // `person` is an ObjectId when unpopulated and a document when populated.
  const person = doc.person as PopulatedPerson | null;
  return {
    id: String(doc._id),
    personId: String(person?._id ?? doc.person),
    personName: person?.name ?? "Unknown",
    personPhone: person?.phone ?? "",
    planName: doc.planName,
    category: doc.category as MembershipCategory,
    purchaseDate: doc.purchaseDate.toISOString(),
    startDate: doc.startDate.toISOString(),
    expiryDate: doc.expiryDate.toISOString(),
    price: doc.price ?? null,
    status: doc.status as MembershipStatus,
    effective: effectiveStatus(
      {
        status: doc.status as MembershipStatus,
        startDate: doc.startDate,
        expiryDate: doc.expiryDate,
      },
      timeZone,
    ),
    renewedFrom: doc.renewedFrom ? String(doc.renewedFrom) : null,
  };
}

/**
 * Builds the date/status filter for a membership "state".
 *
 * These mirror `effectiveStatus` but run in the database so lists can paginate
 * without loading every row. Keep the two in step.
 */
function stateFilter(
  state: MemberFilterInput["state"],
  timeZone: string,
): QueryFilter<MembershipDoc> {
  const todayStart = startOfToday(timeZone);
  const tomorrowStart = startOfDayFromToday(timeZone, 1);
  const expiringEnd = startOfDayFromToday(timeZone, EXPIRING_SOON_DAYS + 1);

  switch (state) {
    case "active":
      return {
        status: "active",
        startDate: { $lt: tomorrowStart },
        expiryDate: { $gte: todayStart },
      };
    case "expiring":
      return {
        status: "active",
        startDate: { $lt: tomorrowStart },
        expiryDate: { $gte: todayStart, $lt: expiringEnd },
      };
    case "expired":
      return {
        status: { $in: ["active", "expired"] },
        expiryDate: { $lt: todayStart },
      };
    case "cancelled":
      return { status: "cancelled" };
    case "terminated":
      return { status: "terminated" };
    default:
      return {};
  }
}

export async function listMemberships(
  filters: MemberFilterInput,
  timeZone: string,
): Promise<{
  memberships: MembershipListItem[];
  total: number;
  page: number;
  pageCount: number;
}> {
  await connectToDatabase();

  const query: QueryFilter<MembershipDoc> = {
    archivedAt: null,
    ...stateFilter(filters.state, timeZone),
  };

  if (filters.category) query.category = filters.category;

  if (filters.q) {
    const pattern = new RegExp(escapeRegex(filters.q), "i");
    const digits = normalizePhone(filters.q);
    const personOr: QueryFilter<PersonDoc>[] = [
      { name: pattern },
      { phone: pattern },
      { email: pattern },
    ];
    if (digits.length >= 3) {
      personOr.push({ phoneNormalized: new RegExp(escapeRegex(digits), "i") });
    }
    const personIds = await Person.find({ $or: personOr }).distinct("_id");
    query.$or = [
      { person: { $in: personIds.map((id) => String(id)) } },
      { planName: pattern },
    ];
  }

  const page = Math.max(1, filters.page);

  const [docs, total] = await Promise.all([
    Membership.find(query)
      .sort({ expiryDate: 1 })
      .skip((page - 1) * MEMBERS_PAGE_SIZE)
      .limit(MEMBERS_PAGE_SIZE)
      .populate("person", "name phone")
      .lean<(MembershipDoc & { person: PopulatedPerson })[]>(),
    Membership.countDocuments(query),
  ]);

  return {
    memberships: docs.map((doc) => toMembershipListItem(doc, timeZone)),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / MEMBERS_PAGE_SIZE)),
  };
}

export async function getMembershipStateCounts(
  timeZone: string,
): Promise<Record<string, number>> {
  await connectToDatabase();

  const base = { archivedAt: null };
  const [all, active, expiring, expired, cancelled, terminated] =
    await Promise.all([
      Membership.countDocuments(base),
      Membership.countDocuments({ ...base, ...stateFilter("active", timeZone) }),
      Membership.countDocuments({
        ...base,
        ...stateFilter("expiring", timeZone),
      }),
      Membership.countDocuments({
        ...base,
        ...stateFilter("expired", timeZone),
      }),
      Membership.countDocuments({
        ...base,
        ...stateFilter("cancelled", timeZone),
      }),
      Membership.countDocuments({
        ...base,
        ...stateFilter("terminated", timeZone),
      }),
    ]);

  return { all, active, expiring, expired, cancelled, terminated };
}

/** Every membership for one person, newest first, for the profile timeline. */
export async function listPersonMemberships(
  personId: string,
  timeZone: string,
): Promise<MembershipListItem[]> {
  await connectToDatabase();

  const docs = await Membership.find({ person: personId, archivedAt: null })
    .sort({ startDate: -1 })
    .populate("person", "name phone")
    .lean<(MembershipDoc & { person: PopulatedPerson })[]>();

  return docs.map((doc) => toMembershipListItem(doc, timeZone));
}

export async function getMembership(
  id: string,
  timeZone: string,
): Promise<
  | (MembershipListItem & {
      notes: string;
      createdBy: string;
      cancelledAt: string | null;
      cancelledReason: string;
      planId: string | null;
    })
  | null
> {
  await connectToDatabase();
  if (!/^[a-f\d]{24}$/i.test(id)) return null;

  const doc = await Membership.findOne({ _id: id, archivedAt: null })
    .populate("person", "name phone")
    .lean<(MembershipDoc & { person: PopulatedPerson })>();
  if (!doc) return null;

  return {
    ...toMembershipListItem(doc, timeZone),
    notes: doc.notes ?? "",
    createdBy: doc.createdBy ?? "",
    cancelledAt: doc.cancelledAt ? doc.cancelledAt.toISOString() : null,
    cancelledReason: doc.cancelledReason ?? "",
    planId: doc.plan ? String(doc.plan) : null,
  };
}

/**
 * The full renewal chain a membership belongs to, oldest first.
 *
 * Walks backwards through `renewedFrom` and forwards through rows that point
 * at each link, so opening any period shows the whole history.
 */
export async function getRenewalChain(
  membershipId: string,
  timeZone: string,
): Promise<MembershipListItem[]> {
  await connectToDatabase();

  const chain: MembershipDoc[] = [];
  const seen = new Set<string>();

  const current = await Membership.findById(membershipId).lean<MembershipDoc>();
  if (!current) return [];

  // Backwards to the original purchase.
  let cursor: MembershipDoc | null = current;
  while (cursor && !seen.has(String(cursor._id))) {
    seen.add(String(cursor._id));
    chain.unshift(cursor);
    cursor = cursor.renewedFrom
      ? await Membership.findById(cursor.renewedFrom).lean<MembershipDoc>()
      : null;
  }

  // Forwards through renewals.
  let tail: MembershipDoc | null = current;
  while (tail) {
    const next: MembershipDoc | null = await Membership.findOne({
      renewedFrom: tail._id,
      archivedAt: null,
    }).lean<MembershipDoc>();
    if (!next || seen.has(String(next._id))) break;
    seen.add(String(next._id));
    chain.push(next);
    tail = next;
  }

  const person = await Person.findById(current.person)
    .select("name phone")
    .lean<PersonDoc>();

  return chain.map((doc) =>
    toMembershipListItem(
      {
        ...doc,
        person: {
          _id: String(current.person),
          name: person?.name ?? "",
          phone: person?.phone ?? "",
        },
      },
      timeZone,
    ),
  );
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

function toPaymentListItem(
  doc: PaymentRecordDoc & {
    person: PopulatedPerson;
    membership?: { _id: unknown; planName: string } | null;
  },
): PaymentListItem {
  return {
    id: String(doc._id),
    personId: String(doc.person?._id ?? doc.person),
    personName: doc.person?.name ?? "Unknown",
    membershipId: doc.membership ? String(doc.membership._id) : null,
    membershipLabel: doc.membership?.planName ?? null,
    amount: doc.amount,
    currency: doc.currency ?? "INR",
    paymentDate: doc.paymentDate.toISOString(),
    method: doc.method as PaymentMethod,
    status: doc.status as PaymentStatus,
    notes: doc.notes ?? "",
  };
}

export async function listPayments(filters: {
  q?: string;
  method?: PaymentMethod;
  page: number;
}): Promise<{
  payments: PaymentListItem[];
  total: number;
  page: number;
  pageCount: number;
  totalAmount: number;
}> {
  await connectToDatabase();

  const query: QueryFilter<PaymentRecordDoc> = { archivedAt: null };
  if (filters.method) query.method = filters.method;

  if (filters.q) {
    const pattern = new RegExp(escapeRegex(filters.q), "i");
    const personIds = await Person.find({
      $or: [{ name: pattern }, { phone: pattern }],
    }).distinct("_id");
    query.person = { $in: personIds.map((id) => String(id)) };
  }

  const page = Math.max(1, filters.page);

  const [docs, total, sum] = await Promise.all([
    PaymentRecord.find(query)
      .sort({ paymentDate: -1, createdAt: -1 })
      .skip((page - 1) * PAYMENTS_PAGE_SIZE)
      .limit(PAYMENTS_PAGE_SIZE)
      .populate("person", "name phone")
      .populate("membership", "planName")
      .lean(),
    PaymentRecord.countDocuments(query),
    PaymentRecord.aggregate<{ total: number }>([
      { $match: { ...query, status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  return {
    payments: (
      docs as unknown as (PaymentRecordDoc & {
        person: PopulatedPerson;
        membership?: { _id: unknown; planName: string } | null;
      })[]
    ).map(toPaymentListItem),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAYMENTS_PAGE_SIZE)),
    totalAmount: sum[0]?.total ?? 0,
  };
}

export async function listPersonPayments(
  personId: string,
): Promise<PaymentListItem[]> {
  await connectToDatabase();

  const docs = await PaymentRecord.find({
    person: personId,
    archivedAt: null,
  })
    .sort({ paymentDate: -1 })
    .populate("person", "name phone")
    .populate("membership", "planName")
    .lean();

  return (
    docs as unknown as (PaymentRecordDoc & {
      person: PopulatedPerson;
      membership?: { _id: unknown; planName: string } | null;
    })[]
  ).map(toPaymentListItem);
}

export async function getPayment(id: string): Promise<
  (PaymentListItem & { personName: string }) | null
> {
  await connectToDatabase();
  if (!/^[a-f\d]{24}$/i.test(id)) return null;

  const doc = await PaymentRecord.findOne({ _id: id, archivedAt: null })
    .populate("person", "name phone")
    .populate("membership", "planName")
    .lean();
  if (!doc) return null;

  return toPaymentListItem(
    doc as unknown as PaymentRecordDoc & {
      person: PopulatedPerson;
      membership?: { _id: unknown; planName: string } | null;
    },
  );
}

/** Memberships a payment can be attached to, for the payment form. */
export async function listPersonMembershipOptions(
  personId: string,
): Promise<{ id: string; label: string }[]> {
  await connectToDatabase();

  const docs = await Membership.find({ person: personId, archivedAt: null })
    .sort({ startDate: -1 })
    .select("planName startDate")
    .lean<MembershipDoc[]>();

  return docs.map((doc) => ({
    id: String(doc._id),
    label: `${doc.planName} · from ${doc.startDate.toISOString().slice(0, 10)}`,
  }));
}

export async function listMembershipPayments(
  membershipId: string,
): Promise<PaymentListItem[]> {
  await connectToDatabase();

  const docs = await PaymentRecord.find({
    membership: membershipId,
    archivedAt: null,
  })
    .sort({ paymentDate: -1 })
    .populate("person", "name phone")
    .populate("membership", "planName")
    .lean();

  return (
    docs as unknown as (PaymentRecordDoc & {
      person: PopulatedPerson;
      membership?: { _id: unknown; planName: string } | null;
    })[]
  ).map(toPaymentListItem);
}
