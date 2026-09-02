import "server-only";
import type { QueryFilter } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import {
  CoachingClient,
  type CoachingClientDoc,
} from "@/models/CoachingClient";
import { Person, type PersonDoc } from "@/models/Person";
import { Lead, type LeadDoc } from "@/models/Lead";
import { normalizePhone } from "@/lib/leads/phone";
import type { CoachingStatus } from "@/lib/people/constants";
import type { LeadSource } from "@/lib/leads/constants";

export const COACHING_PAGE_SIZE = 20;

export type CoachingListItem = {
  id: string;
  personId: string;
  personName: string;
  personPhone: string;
  status: CoachingStatus;
  startDate: string;
  goal: string;
};

export type CoachingDetail = CoachingListItem & {
  personEmail: string;
  personInstagram: string;
  endDate: string | null;
  notes: string;
  createdAt: string;
  sourceLead: {
    id: string;
    source: LeadSource;
    createdAt: string;
  } | null;
};

type PopulatedPerson = {
  _id: unknown;
  name: string;
  phone: string;
  email?: string;
  instagramHandle?: string;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toListItem(
  doc: Omit<CoachingClientDoc, "person"> & { person: unknown },
): CoachingListItem {
  const person = doc.person as PopulatedPerson | null;
  return {
    id: String(doc._id),
    personId: String(person?._id ?? doc.person),
    personName: person?.name ?? "Unknown",
    personPhone: person?.phone ?? "",
    status: doc.status as CoachingStatus,
    startDate: doc.startDate.toISOString(),
    goal: doc.goal ?? "",
  };
}

export async function listCoachingClients(filters: {
  q?: string;
  status?: CoachingStatus;
  page: number;
}): Promise<{
  clients: CoachingListItem[];
  total: number;
  page: number;
  pageCount: number;
}> {
  await connectToDatabase();

  const query: QueryFilter<CoachingClientDoc> = { archivedAt: null };
  if (filters.status) query.status = filters.status;

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
    query.person = { $in: personIds.map((id) => String(id)) };
  }

  const page = Math.max(1, filters.page);

  const [docs, total] = await Promise.all([
    CoachingClient.find(query)
      .sort({ status: 1, startDate: -1 })
      .skip((page - 1) * COACHING_PAGE_SIZE)
      .limit(COACHING_PAGE_SIZE)
      .populate("person", "name phone")
      .lean(),
    CoachingClient.countDocuments(query),
  ]);

  return {
    clients: (
      docs as unknown as (Omit<CoachingClientDoc, "person"> & {
        person: unknown;
      })[]
    ).map(toListItem),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / COACHING_PAGE_SIZE)),
  };
}

export async function getCoachingClient(
  id: string,
): Promise<CoachingDetail | null> {
  await connectToDatabase();
  if (!/^[a-f\d]{24}$/i.test(id)) return null;

  const doc = await CoachingClient.findOne({ _id: id, archivedAt: null })
    .populate("person", "name phone email instagramHandle")
    .lean();
  if (!doc) return null;

  const typed = doc as unknown as Omit<CoachingClientDoc, "person"> & {
    person: PopulatedPerson;
  };

  const sourceLead = typed.sourceLeadId
    ? await Lead.findById(typed.sourceLeadId).lean<LeadDoc>()
    : null;

  return {
    ...toListItem(typed),
    personEmail: typed.person?.email ?? "",
    personInstagram: typed.person?.instagramHandle ?? "",
    endDate: typed.endDate ? typed.endDate.toISOString() : null,
    notes: typed.notes ?? "",
    createdAt: typed.createdAt.toISOString(),
    sourceLead: sourceLead
      ? {
          id: String(sourceLead._id),
          source: sourceLead.source as LeadSource,
          createdAt: sourceLead.createdAt.toISOString(),
        }
      : null,
  };
}

export async function getCoachingStatusCounts(): Promise<
  Record<string, number>
> {
  await connectToDatabase();

  const rows = await CoachingClient.aggregate<{
    _id: CoachingStatus;
    count: number;
  }>([
    { $match: { archivedAt: null } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    counts[row._id] = row.count;
    total += row.count;
  }
  counts.all = total;
  return counts;
}

/** The coaching engagement for a person, if any. Prevents creating a second. */
export async function getCoachingClientForPerson(
  personId: string,
): Promise<{ id: string; status: CoachingStatus } | null> {
  await connectToDatabase();

  const doc = await CoachingClient.findOne({
    person: personId,
    archivedAt: null,
  })
    .sort({ createdAt: -1 })
    .lean<CoachingClientDoc>();

  if (!doc) return null;
  return { id: String(doc._id), status: doc.status as CoachingStatus };
}
