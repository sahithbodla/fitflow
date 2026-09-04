/**
 * Pre-written WhatsApp renewal reminders.
 *
 * One membership category can mean three different real things (a gym floor
 * membership, a personal-training package, an online coaching engagement), so
 * every message is built from the actual category, name and date rather than
 * a single generic template.
 */

export type ReminderCategory = "gym" | "personal_training" | "online_coaching";

const CATEGORY_PHRASES: Record<ReminderCategory, string> = {
  gym: "gym membership",
  personal_training: "personal training package",
  online_coaching: "online coaching",
};

type ReminderInput = {
  personName: string;
  category: ReminderCategory;
  /** Already formatted for display, e.g. "7 Sep 2026". */
  dateLabel: string;
  businessName: string;
};

/** For a membership/engagement expiring within the next few days. */
export function expiringSoonMessage({
  personName,
  category,
  dateLabel,
  businessName,
}: ReminderInput): string {
  return (
    `Hi ${personName}, this is a reminder from ${businessName} — your ${CATEGORY_PHRASES[category]} ` +
    `is expiring on ${dateLabel}. Please renew in advance so your access continues without any ` +
    `interruption. Let us know if you'd like a hand renewing!`
  );
}

/** For a membership/engagement that has already lapsed. */
export function expiredMessage({
  personName,
  category,
  dateLabel,
  businessName,
}: ReminderInput): string {
  return (
    `Hi ${personName}, your ${CATEGORY_PHRASES[category]} at ${businessName} expired on ${dateLabel}. ` +
    `We'd love to have you back — renew today to continue enjoying all the benefits.`
  );
}
