import { z } from "zod";
import { COACHING_STATUSES } from "@/lib/people/constants";

const dateField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), "Enter a valid date");

export const coachingClientSchema = z
  .object({
    personId: z.string().trim().min(1, "Choose a customer"),
    status: z.enum(COACHING_STATUSES).default("active"),
    startDate: dateField("Start date"),
    endDate: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value),
        "Enter a valid date",
      )
      .default(""),
    goal: z.string().trim().max(1000, "Please keep this shorter").default(""),
    notes: z.string().trim().max(2000, "Please keep this shorter").default(""),
  })
  .refine((data) => data.endDate === "" || data.endDate >= data.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export type CoachingClientInput = z.infer<typeof coachingClientSchema>;

export const coachingStatusSchema = z.object({
  clientId: z.string().trim().min(1),
  status: z.enum(COACHING_STATUSES),
});

export const coachingFilterSchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(COACHING_STATUSES).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

export type CoachingFilterInput = z.infer<typeof coachingFilterSchema>;
