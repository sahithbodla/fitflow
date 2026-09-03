import "server-only";
import { Types, type QueryFilter } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Person, type PersonDoc } from "@/models/Person";
import { Conversion, type ConversionDoc } from "@/models/Conversion";
import {
  CoachingClient,
  type CoachingClientDoc,
} from "@/models/CoachingClient";
import { Lead, type LeadDoc } from "@/models/Lead";
import { normalizePhone } from "@/lib/leads/phone";
import type {
  CoachingStatus,
  ConversionType,
} from "@/lib/people/constants";
import type { LeadSource, LeadStatus } from "@/lib/leads/constants";

export const PEOPLE_PAGE_SIZE = 20;

export type PersonListItem = {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
  /** Which destinations this person has been converted into. */
  types: ConversionType[];
};

export type PersonConversion = {
  id: string;
  type: ConversionType;
  convertedAt: string;
  actor: string;
  linkedExistingPerson: boolean;
  leadId: string;
};

export type PersonDetail = {
  id: string;
  name: string;
  phone: string;
  email: string;
  instagramHandle: string;
  fitnessGoal: string;
  notes: string;
  origin: "lead_conversion" | "direct";
  createdAt: string;
  sourceLead: {
    id: string;
    source: LeadSource;
    status: LeadStatus;
    createdAt: string;
    fitnessGoal: string;
  } | null;
  conversions: PersonConversion[];
  coaching: {
    id: string;
    status: CoachingStatus;
    startDate: string;
    goal: string;
  } | null;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Conversion types per person, resolved in one aggregation.
 *
 * The ids must be real ObjectIds: an aggregation pipeline bypasses Mongoose's
 * casting, and MongoDB compares BSON types strictly, so matching a string
 * against an ObjectId field silently returns nothing.
 */
async function conversionTypesByPerson(
  personIds: string[],
): Promise<Map<string, ConversionType[]>> {
  if (personIds.length === 0) return new Map();

  const objectIds = personIds
    .filter((id) => Types.ObjectId.isValid(id))
    .map((id) => new Types.ObjectId(id));
  if (objectIds.length === 0) return new Map();

  const rows = await Conversion.aggregate<{
    _id: unknown;
    types: ConversionType[];
  }>([
    { $match: { person: { $in: objectIds } } },
    { $group: { _id: "$person", types: { $addToSet: "$type" } } },
  ]);

  return new Map(rows.map((row) => [String(row._id), row.types]));
}

export async function listPeople(filters: {
  q?: string;
  type?: ConversionType;
  page: number;
}): Promise<{
  people: PersonListItem[];
  total: number;
  page: number;
  pageCount: number;
}> {
  await connectToDatabase();

  const query: QueryFilter<PersonDoc> = { archivedAt: null };

  if (filters.q) {
    const pattern = new RegExp(escapeRegex(filters.q), "i");
    const digits = normalizePhone(filters.q);
    const or: QueryFilter<PersonDoc>[] = [
      { name: pattern },
      { email: pattern },
      { phone: pattern },
    ];
    if (digits.length >= 3) {
      or.push({ phoneNormalized: new RegExp(escapeRegex(digits), "i") });
    }
    query.$or = or;
  }

  // Filtering by type means "has a conversion of this type".
  if (filters.type) {
    const ids = await Conversion.find({ type: filters.type }).distinct("person");
    query._id = { $in: ids.map((id) => String(id)) };
  }

  const page = Math.max(1, filters.page);

  const [docs, total] = await Promise.all([
    Person.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PEOPLE_PAGE_SIZE)
      .limit(PEOPLE_PAGE_SIZE)
      .lean<PersonDoc[]>(),
    Person.countDocuments(query),
  ]);

  const typeMap = await conversionTypesByPerson(
    docs.map((doc) => String(doc._id)),
  );

  return {
    people: docs.map((doc) => ({
      id: String(doc._id),
      name: doc.name,
      phone: doc.phone,
      email: doc.email ?? "",
      createdAt: doc.createdAt.toISOString(),
      types: typeMap.get(String(doc._id)) ?? [],
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PEOPLE_PAGE_SIZE)),
  };
}

export async function getPerson(id: string): Promise<PersonDetail | null> {
  await connectToDatabase();

  if (!/^[a-f\d]{24}$/i.test(id)) return null;

  const doc = await Person.findOne({ _id: id, archivedAt: null }).lean<PersonDoc>();
  if (!doc) return null;

  const [conversions, coaching, sourceLead] = await Promise.all([
    Conversion.find({ person: id })
      .sort({ convertedAt: -1 })
      .lean<ConversionDoc[]>(),
    CoachingClient.findOne({ person: id, archivedAt: null })
      .sort({ createdAt: -1 })
      .lean<CoachingClientDoc>(),
    doc.sourceLeadId
      ? Lead.findById(doc.sourceLeadId).lean<LeadDoc>()
      : Promise.resolve(null),
  ]);

  return {
    id: String(doc._id),
    name: doc.name,
    phone: doc.phone,
    email: doc.email ?? "",
    instagramHandle: doc.instagramHandle ?? "",
    fitnessGoal: doc.fitnessGoal ?? "",
    notes: doc.notes ?? "",
    origin: doc.origin as "lead_conversion" | "direct",
    createdAt: doc.createdAt.toISOString(),
    sourceLead: sourceLead
      ? {
          id: String(sourceLead._id),
          source: sourceLead.source as LeadSource,
          status: sourceLead.status as LeadStatus,
          createdAt: sourceLead.createdAt.toISOString(),
          fitnessGoal: sourceLead.fitnessGoal ?? "",
        }
      : null,
    conversions: conversions.map((row) => ({
      id: String(row._id),
      type: row.type as ConversionType,
      convertedAt: row.convertedAt.toISOString(),
      actor: row.actor,
      linkedExistingPerson: row.linkedExistingPerson,
      leadId: String(row.lead),
    })),
    coaching: coaching
      ? {
          id: String(coaching._id),
          status: coaching.status as CoachingStatus,
          startDate: coaching.startDate.toISOString(),
          goal: coaching.goal ?? "",
        }
      : null,
  };
}

/** An existing customer who looks like the same human as this lead. */
export async function findMatchingPerson(
  phone: string,
  email: string,
): Promise<{ id: string; name: string; phone: string } | null> {
  await connectToDatabase();

  const or: QueryFilter<PersonDoc>[] = [
    { phoneNormalized: normalizePhone(phone) },
  ];
  if (email) or.push({ email });

  const doc = await Person.findOne({ $or: or, archivedAt: null })
    .sort({ createdAt: -1 })
    .lean<PersonDoc>();

  if (!doc) return null;
  return { id: String(doc._id), name: doc.name, phone: doc.phone };
}

export async function getPeopleTypeCounts(): Promise<Record<string, number>> {
  await connectToDatabase();

  const [rows, total] = await Promise.all([
    Conversion.aggregate<{ _id: ConversionType; people: string[] }>([
      { $group: { _id: "$type", people: { $addToSet: "$person" } } },
    ]),
    Person.countDocuments({ archivedAt: null }),
  ]);

  const counts: Record<string, number> = { all: total };
  for (const row of rows) counts[row._id] = row.people.length;
  return counts;
}
