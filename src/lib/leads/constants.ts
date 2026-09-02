/** Shared vocabulary for leads: values, labels and display treatment. */

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "interested",
  "follow_up",
  "converted",
  "lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_INTERESTS = [
  "gym",
  "personal_training",
  "online_coaching",
] as const;
export type LeadInterest = (typeof LEAD_INTERESTS)[number];

export const LEAD_SOURCES = ["public_form", "manual", "other"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  follow_up: "Follow-up",
  converted: "Converted",
  lost: "Lost",
};

export const LEAD_INTEREST_LABELS: Record<LeadInterest, string> = {
  gym: "Gym membership",
  personal_training: "Personal training",
  online_coaching: "Online coaching",
};

/** Shorter forms for list chips where horizontal space is tight. */
export const LEAD_INTEREST_SHORT: Record<LeadInterest, string> = {
  gym: "Gym",
  personal_training: "PT",
  online_coaching: "Online",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  public_form: "Enquiry form",
  manual: "Added manually",
  other: "Other",
};

/** Tailwind classes per status. Deliberately calm — badges should not shout. */
export const LEAD_STATUS_CLASSES: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  contacted:
    "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  interested:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  follow_up:
    "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  converted:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  lost: "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

/** Statuses that mean the lead is no longer being actively worked. */
export const CLOSED_STATUSES: readonly LeadStatus[] = ["converted", "lost"];

export function isOpenStatus(status: LeadStatus): boolean {
  return !CLOSED_STATUSES.includes(status);
}

export const ACTIVITY_TYPES = [
  "created",
  "note",
  "status_change",
  "follow_up_set",
  "follow_up_cleared",
  "details_updated",
  "converted",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
