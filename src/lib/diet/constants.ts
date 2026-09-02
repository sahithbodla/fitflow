/** Shared vocabulary for diet plans. */

export const DIET_GOALS = [
  "fat_loss",
  "muscle_gain",
  "maintenance",
  "performance",
  "other",
] as const;
export type DietGoal = (typeof DIET_GOALS)[number];

export const DIET_GOAL_LABELS: Record<DietGoal, string> = {
  fat_loss: "Fat loss",
  muscle_gain: "Muscle gain",
  maintenance: "Maintenance",
  performance: "Performance",
  other: "Other",
};

/** Suggested section names offered when adding a meal. Free text is allowed. */
export const COMMON_MEAL_NAMES = [
  "Breakfast",
  "Mid-morning",
  "Lunch",
  "Pre-workout",
  "Post-workout",
  "Snack",
  "Dinner",
] as const;
