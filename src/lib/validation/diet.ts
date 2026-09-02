import { z } from "zod";
import { DIET_GOALS } from "@/lib/diet/constants";

const optionalNumber = (label: string, max: number) =>
  z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (!Number.isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= max),
      `${label} must be between 0 and ${max}`,
    )
    .default("");

export const dietPlanSchema = z.object({
  coachingClientId: z.string().trim().min(1),
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(120, "Title is too long"),
  goal: z.union([z.enum(DIET_GOALS), z.literal("")]).default(""),
  notes: z.string().trim().max(2000, "Please keep this shorter").default(""),
  calorieTarget: optionalNumber("Calories", 20000),
  proteinTarget: optionalNumber("Protein", 2000),
  carbTarget: optionalNumber("Carbs", 2000),
  fatTarget: optionalNumber("Fat", 2000),
  startDate: z
    .string()
    .trim()
    .min(1, "Start date is required")
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), "Enter a valid date"),
});

export type DietPlanInput = z.infer<typeof dietPlanSchema>;

export const dietMealSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the meal a name")
    .max(80, "Name is too long"),
  time: z.string().trim().max(40, "Too long").default(""),
  notes: z.string().trim().max(500, "Please keep this shorter").default(""),
});

export const dietItemSchema = z.object({
  food: z
    .string()
    .trim()
    .min(1, "What are they eating?")
    .max(160, "Name is too long"),
  quantity: z.string().trim().max(80, "Too long").default(""),
  notes: z.string().trim().max(300, "Please keep this shorter").default(""),
});
