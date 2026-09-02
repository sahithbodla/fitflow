/** Shared vocabulary for the exercise library and workout builder. */

export const EXERCISE_CATEGORIES = [
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "core",
  "glutes",
  "full_body",
  "cardio",
  "mobility",
  "other",
] as const;
export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];

export const EXERCISE_CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  arms: "Arms",
  legs: "Legs",
  core: "Core",
  glutes: "Glutes",
  full_body: "Full body",
  cardio: "Cardio",
  mobility: "Mobility",
  other: "Other",
};

export const WORKOUT_GOALS = [
  "general_fitness",
  "fat_loss",
  "muscle_gain",
  "strength",
  "endurance",
  "rehab",
  "other",
] as const;
export type WorkoutGoal = (typeof WORKOUT_GOALS)[number];

export const WORKOUT_GOAL_LABELS: Record<WorkoutGoal, string> = {
  general_fitness: "General fitness",
  fat_loss: "Fat loss",
  muscle_gain: "Muscle gain",
  strength: "Strength",
  endurance: "Endurance",
  rehab: "Rehab",
  other: "Other",
};

/**
 * Whether a URL is an acceptable external video link.
 *
 * Videos are linked, never uploaded — this MVP has no file storage. Any
 * https URL is accepted so coaches can use whatever platform they already use;
 * the check exists to catch typos, not to whitelist providers.
 */
export function isValidVideoUrl(value: string): boolean {
  if (value === "") return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Extracts a YouTube video id so the UI can show a thumbnail link. */
export function youTubeId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return url.pathname.slice(1) || null;
    if (url.hostname.endsWith("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v) return v;
      if (url.pathname.startsWith("/embed/")) {
        return url.pathname.split("/")[2] ?? null;
      }
    }
    return null;
  } catch {
    return null;
  }
}
