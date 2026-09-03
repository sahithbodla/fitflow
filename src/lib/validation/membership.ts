import { z } from "zod";
import {
  MEMBERSHIP_CATEGORIES,
  MEMBERSHIP_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from "@/lib/memberships/constants";

const dateField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), "Enter a valid date");

const optionalNumber = (label: string, max: number) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === "" || (!Number.isNaN(Number(value)) && Number(value) >= 0),
      `${label} must be a positive number`,
    )
    .refine(
      (value) => value === "" || Number(value) <= max,
      `${label} is unrealistically large`,
    )
    .default("");

export const membershipPlanSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name is too long"),
  category: z.enum(MEMBERSHIP_CATEGORIES, { message: "Choose a category" }),
  description: z.string().trim().max(500, "Description is too long").default(""),
  defaultDurationDays: optionalNumber("Duration", 3650),
  defaultPrice: optionalNumber("Price", 10_000_000),
  active: z.string().optional(),
});

export type MembershipPlanInput = z.infer<typeof membershipPlanSchema>;

export const membershipSchema = z
  .object({
    personId: z.string().trim().min(1, "Choose a customer"),
    planId: z.string().trim().default(""),
    planName: z
      .string()
      .trim()
      .min(2, "Plan name is required")
      .max(120, "Plan name is too long"),
    category: z.enum(MEMBERSHIP_CATEGORIES, { message: "Choose a category" }),
    purchaseDate: dateField("Purchase date"),
    startDate: dateField("Start date"),
    expiryDate: dateField("Expiry date"),
    price: optionalNumber("Price", 10_000_000),
    status: z.enum(MEMBERSHIP_STATUSES).default("active"),
    notes: z.string().trim().max(2000, "Note is too long").default(""),
    renewedFrom: z.string().trim().default(""),
  })
  // Expiry is set explicitly rather than derived, so it has to be checked.
  .refine((data) => data.expiryDate >= data.startDate, {
    message: "Expiry date must be on or after the start date",
    path: ["expiryDate"],
  });

export type MembershipInput = z.infer<typeof membershipSchema>;

export const paymentSchema = z.object({
  personId: z.string().trim().min(1, "Choose a customer"),
  membershipId: z.string().trim().default(""),
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .refine(
      (value) => !Number.isNaN(Number(value)) && Number(value) >= 0,
      "Amount must be a positive number",
    )
    .refine(
      (value) => Number(value) <= 10_000_000,
      "Amount is unrealistically large",
    ),
  paymentDate: dateField("Payment date"),
  method: z.enum(PAYMENT_METHODS, { message: "Choose a payment method" }),
  status: z.enum(PAYMENT_STATUSES).default("paid"),
  notes: z.string().trim().max(2000, "Note is too long").default(""),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export const endMembershipSchema = z.object({
  membershipId: z.string().trim().min(1),
  /** Who ended it: the member cancelled, or the business terminated them. */
  mode: z.enum(["cancelled", "terminated"]),
  reason: z.string().trim().max(500, "Reason is too long").default(""),
});

export const memberFilterSchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.enum(MEMBERSHIP_CATEGORIES).optional(),
  state: z
    .enum(["active", "expiring", "expired", "cancelled", "terminated"])
    .optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

export type MemberFilterInput = z.infer<typeof memberFilterSchema>;

export const paymentFilterSchema = z.object({
  q: z.string().trim().max(120).optional(),
  method: z.enum(PAYMENT_METHODS).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});
