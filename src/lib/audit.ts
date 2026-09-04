import "server-only";
import { connectToDatabase } from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";
import { logger } from "@/lib/logger";
import type { AuditAction, AuditEntityType } from "@/lib/audit/actions";

/**
 * Writes one audit entry. Best-effort and never throws — a logging failure
 * must never break the mutation it's describing (a payment that saved but
 * failed to audit is fine; a payment that failed *because* auditing did is
 * not). Failures are themselves logged so they're not silently lost.
 */
export async function recordAudit(entry: {
  actorUserId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await connectToDatabase();
    await AuditLog.create({
      actorUserId: entry.actorUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata ?? {},
    });
  } catch (error) {
    logger.error("Failed to write audit log entry", error, {
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
    });
  }
}

/**
 * Metadata for an *_UPDATED audit entry: only the fields that actually
 * changed, as `{ from, to }` pairs — never the whole document. Fields whose
 * before/after are equal (by `String()`, so a Date and its ISO form still
 * match) are left out entirely.
 */
/** Dates compare by instant, not by `String(Date)` vs. an ISO string. */
function comparable(value: unknown): unknown {
  return value instanceof Date ? value.toISOString() : value;
}

/**
 * `before` and `after` are intentionally untyped `Record`s, not a shared
 * generic — callers usually pass a `.select()`-projected lean document as
 * `before` and a plain object of the new values as `after`, which are never
 * the same TypeScript shape even though they describe the same fields.
 */
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[],
): { changes: Record<string, { from: unknown; to: unknown }> } {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const field of fields) {
    const from = before[field];
    const to = after[field];
    if (String(comparable(from) ?? "") !== String(comparable(to) ?? "")) {
      changes[field] = { from: from ?? null, to: to ?? null };
    }
  }
  return { changes };
}
