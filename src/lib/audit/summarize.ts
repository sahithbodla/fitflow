import type { AuditAction } from "@/lib/audit/actions";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  LEAD_CREATED: "Lead created",
  LEAD_UPDATED: "Lead updated",
  LEAD_STATUS_CHANGED: "Lead status changed",
  LEAD_CONVERTED: "Lead converted",

  MEMBERSHIP_CREATED: "Membership created",
  MEMBERSHIP_UPDATED: "Membership updated",
  MEMBERSHIP_RENEWED: "Membership renewed",
  MEMBERSHIP_STATUS_CHANGED: "Membership status changed",

  PAYMENT_CREATED: "Payment recorded",
  PAYMENT_UPDATED: "Payment updated",
  PAYMENT_VOIDED: "Payment voided",

  COACHING_CLIENT_CREATED: "Coaching client added",
  WORKOUT_ASSIGNED: "Workout assigned",
  WORKOUT_UPDATED: "Workout updated",
  DIET_PLAN_CREATED: "Diet plan created",
  DIET_PLAN_UPDATED: "Diet plan updated",
  CHECKIN_CREATED: "Check-in logged",
};

/** A short, human line of what changed — never the raw metadata object. */
function summarizeChanges(metadata: Record<string, unknown>): string | null {
  const changes = metadata.changes;
  if (!changes || typeof changes !== "object") return null;
  const entries = Object.entries(changes as Record<string, { from?: unknown; to?: unknown }>);
  if (entries.length === 0) return null;
  return entries
    .map(([field, change]) => `${field}: ${format(change?.from)} → ${format(change?.to)}`)
    .join(", ");
}

function format(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

/**
 * The subject line (who/what this event is about) and a one-line detail,
 * shown under the action label on the audit log page. Defensive throughout —
 * metadata is a free-form object and an older or hand-edited entry may be
 * missing a field.
 */
export function summarizeAuditEntry(entry: {
  action: AuditAction;
  metadata: Record<string, unknown>;
}): { subject: string; detail: string } {
  const m = entry.metadata ?? {};
  const subject = format(
    m.personName ?? m.leadName ?? m.clientName ?? m.name ?? entry.action,
  );

  switch (entry.action) {
    case "PAYMENT_CREATED": {
      const amount = m.amount ? `${m.currency ?? ""} ${m.amount}`.trim() : null;
      return {
        subject,
        detail: [amount, m.method].filter(Boolean).join(" • ") || "—",
      };
    }
    case "PAYMENT_UPDATED":
      return { subject, detail: summarizeChanges(m) ?? "Details updated" };
    case "PAYMENT_VOIDED": {
      const amount = m.amount ? `${m.currency ?? ""} ${m.amount}`.trim() : null;
      return { subject, detail: [amount, m.reason].filter(Boolean).join(" • ") || "Voided" };
    }

    case "MEMBERSHIP_CREATED":
      return {
        subject,
        detail: [m.planName, m.category].filter(Boolean).join(" • ") || "—",
      };
    case "MEMBERSHIP_RENEWED":
      return { subject, detail: m.planName ? String(m.planName) : "Renewed" };
    case "MEMBERSHIP_UPDATED":
      return { subject, detail: summarizeChanges(m) ?? "Details updated" };
    case "MEMBERSHIP_STATUS_CHANGED":
      return {
        subject,
        detail: m.from && m.to ? `${format(m.from)} → ${format(m.to)}` : "Status changed",
      };

    case "LEAD_CREATED":
      return { subject, detail: [m.phone, m.source].filter(Boolean).join(" • ") || "—" };
    case "LEAD_UPDATED":
      return { subject, detail: summarizeChanges(m) ?? "Details updated" };
    case "LEAD_STATUS_CHANGED":
      return {
        subject,
        detail: m.from && m.to ? `${format(m.from)} → ${format(m.to)}` : "Status changed",
      };
    case "LEAD_CONVERTED":
      return { subject, detail: m.convertedTo ? `Converted to ${m.convertedTo}` : "Converted" };

    case "COACHING_CLIENT_CREATED":
      return { subject, detail: m.goal ? String(m.goal) : "Coaching started" };
    case "WORKOUT_ASSIGNED":
    case "WORKOUT_UPDATED":
      return { subject, detail: m.templateName ? String(m.templateName) : "Workout plan" };
    case "DIET_PLAN_CREATED":
    case "DIET_PLAN_UPDATED":
      return { subject, detail: m.planName ? String(m.planName) : "Diet plan" };
    case "CHECKIN_CREATED":
      return { subject, detail: m.weight ? `${m.weight} ${m.weightUnit ?? ""}`.trim() : "Check-in" };

    default:
      return { subject, detail: "" };
  }
}
