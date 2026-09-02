import "server-only";
import type { QueryFilter } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Lead, type LeadDoc } from "@/models/Lead";
import { normalizePhone } from "@/lib/leads/phone";
import { startOfDayFromToday, startOfToday } from "@/lib/dates";
import type {
  ActivityType,
  LeadInterest,
  LeadSource,
  LeadStatus,
} from "@/lib/leads/constants";
import type { LeadFilterInput } from "@/lib/validation/lead";

export const LEADS_PAGE_SIZE = 20;

/** Plain, serialisable shape handed to client components. */
export type LeadListItem = {
  id: string;
  name: string;
  phone: string;
  email: string;
  instagramHandle: string;
  interestedIn: LeadInterest;
  source: LeadSource;
  status: LeadStatus;
  followUpDate: string | null;
  createdAt: string;
};

export type LeadActivityItem = {
  id: string;
  type: ActivityType;
  message: string;
  actor: string;
  createdAt: string;
};

export type LeadDetail = LeadListItem & {
  fitnessGoal: string;
  updatedAt: string;
  convertedAt: string | null;
  activity: LeadActivityItem[];
};

function toListItem(doc: LeadDoc): LeadListItem {
  return {
    id: String(doc._id),
    name: doc.name,
    phone: doc.phone,
    email: doc.email ?? "",
    instagramHandle: doc.instagramHandle ?? "",
    interestedIn: doc.interestedIn as LeadInterest,
    source: doc.source as LeadSource,
    status: doc.status as LeadStatus,
    followUpDate: doc.followUpDate ? doc.followUpDate.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
  };
}

/** Escapes user input before it reaches a MongoDB regex. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildLeadFilter(
  filters: LeadFilterInput,
  timeZone: string,
): QueryFilter<LeadDoc> {
  const query: QueryFilter<LeadDoc> = { archivedAt: null };

  if (filters.status) query.status = filters.status;
  if (filters.interest) query.interestedIn = filters.interest;
  if (filters.source) query.source = filters.source;

  if (filters.q) {
    const term = escapeRegex(filters.q);
    const pattern = new RegExp(term, "i");
    const digits = normalizePhone(filters.q);

    const or: QueryFilter<LeadDoc>[] = [
      { name: pattern },
      { email: pattern },
      { instagramHandle: pattern },
      { phone: pattern },
    ];
    if (digits.length >= 3) {
      or.push({ phoneNormalized: new RegExp(escapeRegex(digits), "i") });
    }
    query.$or = or;
  }

  if (filters.due) {
    const todayStart = startOfToday(timeZone);
    const tomorrowStart = startOfDayFromToday(timeZone, 1);
    const weekEnd = startOfDayFromToday(timeZone, 8);

    // "Due" only ever means leads still being worked.
    query.status = filters.status ?? { $nin: ["converted", "lost"] };

    if (filters.due === "overdue") {
      query.followUpDate = { $ne: null, $lt: todayStart };
    } else if (filters.due === "today") {
      query.followUpDate = { $gte: todayStart, $lt: tomorrowStart };
    } else {
      query.followUpDate = { $ne: null, $lt: weekEnd };
    }
  }

  return query;
}

export async function listLeads(
  filters: LeadFilterInput,
  timeZone: string,
): Promise<{
  leads: LeadListItem[];
  total: number;
  page: number;
  pageCount: number;
}> {
  await connectToDatabase();

  const query = buildLeadFilter(filters, timeZone);
  const page = Math.max(1, filters.page);

  const [docs, total] = await Promise.all([
    Lead.find(query)
      // Leads with a follow-up date surface first, oldest due first.
      .sort({ followUpDate: 1, createdAt: -1 })
      .skip((page - 1) * LEADS_PAGE_SIZE)
      .limit(LEADS_PAGE_SIZE)
      .lean<LeadDoc[]>(),
    Lead.countDocuments(query),
  ]);

  return {
    leads: docs.map(toListItem),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / LEADS_PAGE_SIZE)),
  };
}

export async function getLead(id: string): Promise<LeadDetail | null> {
  await connectToDatabase();

  if (!/^[a-f\d]{24}$/i.test(id)) return null;

  const doc = await Lead.findOne({ _id: id, archivedAt: null }).lean<LeadDoc>();
  if (!doc) return null;

  const activity = [...(doc.activity ?? [])]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((entry) => ({
      id: String(entry._id),
      type: entry.type as ActivityType,
      message: entry.message,
      actor: entry.actor,
      createdAt: entry.createdAt.toISOString(),
    }));

  return {
    ...toListItem(doc),
    fitnessGoal: doc.fitnessGoal ?? "",
    updatedAt: doc.updatedAt.toISOString(),
    convertedAt: doc.convertedAt ? doc.convertedAt.toISOString() : null,
    activity,
  };
}

/** Counts per status for the filter chips, in one round trip. */
export async function getLeadStatusCounts(): Promise<Record<string, number>> {
  await connectToDatabase();

  const rows = await Lead.aggregate<{ _id: string; count: number }>([
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

/** Where a lead has already been converted to, if anywhere. */
export async function getLeadConversions(leadId: string): Promise<
  { type: string; personId: string; convertedAt: string; actor: string }[]
> {
  await connectToDatabase();
  const { Conversion } = await import("@/models/Conversion");

  const rows = await Conversion.find({ lead: leadId })
    .sort({ convertedAt: -1 })
    .lean();

  return rows.map((row) => ({
    type: String(row.type),
    personId: String(row.person),
    convertedAt: row.convertedAt.toISOString(),
    actor: row.actor,
  }));
}

/** Existing leads that look like the same person. Used to warn before creating. */
export async function findPossibleDuplicates(
  phone: string,
  email: string,
  excludeId?: string,
): Promise<LeadListItem[]> {
  await connectToDatabase();

  const or: QueryFilter<LeadDoc>[] = [{ phoneNormalized: normalizePhone(phone) }];
  if (email) or.push({ email });

  const query: QueryFilter<LeadDoc> = { $or: or, archivedAt: null };
  if (excludeId) query._id = { $ne: excludeId };

  const docs = await Lead.find(query)
    .sort({ createdAt: -1 })
    .limit(5)
    .lean<LeadDoc[]>();

  return docs.map(toListItem);
}
