/** Shared vocabulary for weekly check-ins. */

export const ADHERENCE_LEVELS = [
  "excellent",
  "good",
  "ok",
  "poor",
] as const;
export type AdherenceLevel = (typeof ADHERENCE_LEVELS)[number];

export const ADHERENCE_LABELS: Record<AdherenceLevel, string> = {
  excellent: "Excellent",
  good: "Good",
  ok: "OK",
  poor: "Poor",
};

/** Rough percentage shown alongside the label, for a shared vocabulary. */
export const ADHERENCE_HINTS: Record<AdherenceLevel, string> = {
  excellent: "90–100%",
  good: "70–90%",
  ok: "50–70%",
  poor: "under 50%",
};

export const ADHERENCE_CLASSES: Record<AdherenceLevel, string> = {
  excellent:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  good: "bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300",
  ok: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  poor: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export const WEIGHT_UNITS = ["kg", "lb"] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];
