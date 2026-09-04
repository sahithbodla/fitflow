import "server-only";
import { connectToDatabase } from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";
import { zonedDayStart } from "@/lib/dates";
import type { AuditAction, AuditEntityType } from "@/lib/audit/actions";

const PAGE_SIZE = 30;

export type AuditLogListItem = {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  actorName: string;
  createdAt: string;
};

export type AuditLogFilters = {
  action?: AuditAction;
  entityType?: AuditEntityType;
  /** `yyyy-mm-dd` in the business timezone — entries from that one day. */
  date?: string;
  page: number;
};

export async function listAuditLogs(
  filters: AuditLogFilters,
  timeZone: string,
): Promise<{
  entries: AuditLogListItem[];
  total: number;
  page: number;
  pageCount: number;
}> {
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (filters.action) query.action = filters.action;
  if (filters.entityType) query.entityType = filters.entityType;
  const dateMatch = filters.date ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(filters.date) : null;
  if (dateMatch) {
    const dayStart = zonedDayStart(
      Number(dateMatch[1]),
      Number(dateMatch[2]),
      Number(dateMatch[3]),
      timeZone,
    );
    const nextDayStart = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    query.createdAt = { $gte: dayStart, $lt: nextDayStart };
  }

  const page = Math.max(1, filters.page);

  const [docs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .populate("actorUserId", "name")
      .lean<
        {
          _id: string;
          action: AuditAction;
          entityType: string;
          entityId: string;
          metadata: Record<string, unknown>;
          actorUserId: { name: string } | string | null;
          createdAt: Date;
        }[]
      >(),
    AuditLog.countDocuments(query),
  ]);

  return {
    entries: docs.map((doc) => ({
      id: String(doc._id),
      action: doc.action,
      entityType: doc.entityType,
      entityId: doc.entityId,
      metadata: doc.metadata ?? {},
      actorName:
        doc.actorUserId && typeof doc.actorUserId === "object"
          ? doc.actorUserId.name
          : "Deleted user",
      createdAt: doc.createdAt.toISOString(),
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}
