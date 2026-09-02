import { z } from "zod";
import { ADHERENCE_LEVELS, WEIGHT_UNITS } from "@/lib/checkins/constants";

export const checkInSchema = z.object({
  coachingClientId: z.string().trim().min(1),
  checkInDate: z
    .string()
    .trim()
    .min(1, "Check-in date is required")
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), "Enter a valid date"),
  weight: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (!Number.isNaN(Number(value)) &&
          Number(value) > 0 &&
          Number(value) <= 1000),
      "Enter a weight between 0 and 1000",
    )
    .default(""),
  weightUnit: z.enum(WEIGHT_UNITS).default("kg"),
  dietAdherence: z
    .union([z.enum(ADHERENCE_LEVELS), z.literal("")])
    .default(""),
  workoutAdherence: z
    .union([z.enum(ADHERENCE_LEVELS), z.literal("")])
    .default(""),
  questions: z.string().trim().max(2000, "Please keep this shorter").default(""),
  coachNotes: z
    .string()
    .trim()
    .max(2000, "Please keep this shorter")
    .default(""),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
