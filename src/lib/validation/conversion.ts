import { z } from "zod";
import { CONVERSION_TYPES } from "@/lib/people/constants";

export const convertLeadSchema = z.object({
  leadId: z.string().trim().min(1),
  type: z.enum(CONVERSION_TYPES, { message: "Choose what to convert them to" }),
  /**
   * When an existing customer matches this lead, the staff member decides
   * whether to attach the conversion to them or create a separate record.
   */
  linkPersonId: z.string().trim().optional().default(""),
  notes: z.string().trim().max(2000, "Note is too long").default(""),
});

export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;

export const updatePersonSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name is too long"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .max(30, "Phone number is too long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(200)
    .refine(
      (value) => value === "" || z.string().email().safeParse(value).success,
      "Enter a valid email address",
    )
    .default(""),
  instagramHandle: z
    .string()
    .trim()
    .max(60)
    .transform((value) => value.replace(/^@/, ""))
    .default(""),
  fitnessGoal: z.string().trim().max(1000, "Please keep this shorter").default(""),
  notes: z.string().trim().max(2000, "Please keep this shorter").default(""),
});

export const peopleFilterSchema = z.object({
  q: z.string().trim().max(120).optional(),
  type: z.enum(CONVERSION_TYPES).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

export type PeopleFilterInput = z.infer<typeof peopleFilterSchema>;
