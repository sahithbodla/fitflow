/** Shared vocabulary for people (customers) and conversions. */

export const CONVERSION_TYPES = [
  "gym_member",
  "pt_client",
  "online_coaching",
] as const;
export type ConversionType = (typeof CONVERSION_TYPES)[number];

export const CONVERSION_TYPE_LABELS: Record<ConversionType, string> = {
  gym_member: "Gym member",
  pt_client: "Personal training client",
  online_coaching: "Online coaching client",
};

export const CONVERSION_TYPE_SHORT: Record<ConversionType, string> = {
  gym_member: "Gym",
  pt_client: "PT",
  online_coaching: "Coaching",
};

export const CONVERSION_TYPE_BLURBS: Record<ConversionType, string> = {
  gym_member: "Gym floor access. You'll set up their membership next.",
  pt_client: "One-to-one sessions. You'll set up their PT package next.",
  online_coaching: "Remote programming, diet and weekly check-ins.",
};

/** Maps what a lead said they wanted to the matching conversion destination. */
export const INTEREST_TO_CONVERSION: Record<string, ConversionType> = {
  gym: "gym_member",
  personal_training: "pt_client",
  online_coaching: "online_coaching",
};

export const COACHING_STATUSES = ["active", "paused", "ended"] as const;
export type CoachingStatus = (typeof COACHING_STATUSES)[number];

export const COACHING_STATUS_LABELS: Record<CoachingStatus, string> = {
  active: "Active",
  paused: "Paused",
  ended: "Ended",
};

export const COACHING_STATUS_CLASSES: Record<CoachingStatus, string> = {
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  ended:
    "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};
