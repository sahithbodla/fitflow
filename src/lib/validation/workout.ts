import { z } from "zod";
import {
  EXERCISE_CATEGORIES,
  WORKOUT_GOALS,
  isValidVideoUrl,
} from "@/lib/workouts/constants";

export const exerciseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name is too long"),
  category: z
    .union([z.enum(EXERCISE_CATEGORIES), z.literal("")])
    .default(""),
  instructions: z
    .string()
    .trim()
    .max(2000, "Please keep this shorter")
    .default(""),
  externalVideoUrl: z
    .string()
    .trim()
    .max(500, "URL is too long")
    .refine(isValidVideoUrl, "Enter a full URL starting with https://")
    .default(""),
  active: z.string().optional(),
});

export type ExerciseInput = z.infer<typeof exerciseSchema>;

export const exerciseFilterSchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.enum(EXERCISE_CATEGORIES).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

/** Shared by workout templates and client plans. */
export const workoutDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name is too long"),
  description: z
    .string()
    .trim()
    .max(1000, "Please keep this shorter")
    .default(""),
  goal: z.union([z.enum(WORKOUT_GOALS), z.literal("")]).default(""),
});

export const workoutDaySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the day a name")
    .max(80, "Name is too long"),
  notes: z.string().trim().max(500, "Please keep this shorter").default(""),
});

export const workoutExerciseSchema = z.object({
  /** Either pick from the library… */
  exerciseId: z.string().trim().default(""),
  /** …or type a one-off name. One of the two is required. */
  exerciseName: z
    .string()
    .trim()
    .max(120, "Name is too long")
    .default(""),
  sets: z.string().trim().max(40, "Too long").default(""),
  reps: z.string().trim().max(40, "Too long").default(""),
  rest: z.string().trim().max(40, "Too long").default(""),
  notes: z.string().trim().max(500, "Please keep this shorter").default(""),
});

export type WorkoutExerciseInput = z.infer<typeof workoutExerciseSchema>;

export const assignWorkoutSchema = z.object({
  coachingClientId: z.string().trim().min(1),
  templateId: z.string().trim().default(""),
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name is too long"),
  startDate: z
    .string()
    .trim()
    .min(1, "Start date is required")
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), "Enter a valid date"),
});
