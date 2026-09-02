import { z } from "zod";
import {
  LEAD_INTERESTS,
  LEAD_SOURCES,
  LEAD_STATUSES,
} from "@/lib/leads/constants";
import { isPlausiblePhone } from "@/lib/leads/phone";

const nameField = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(120, "Name is too long");

const phoneField = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .max(30, "Phone number is too long")
  .refine(isPlausiblePhone, "Enter a valid phone number");

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(200)
  .refine(
    (value) => value === "" || z.string().email().safeParse(value).success,
    "Enter a valid email address",
  )
  .default("");

const optionalDate = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || !Number.isNaN(Date.parse(value)),
    "Enter a valid date",
  )
  .default("");

/**
 * The public enquiry form.
 *
 * Deliberately narrow: a visitor may only supply their own contact details and
 * what they are interested in. `status`, `source` and every other privileged
 * field are set server-side and are not accepted from the client at all.
 */
export const publicLeadSchema = z.object({
  name: nameField,
  phone: phoneField,
  email: optionalEmail,
  interestedIn: z.enum(LEAD_INTERESTS, {
    message: "Choose what you're interested in",
  }),
  fitnessGoal: z.string().trim().max(1000, "Please keep this shorter").default(""),
  /**
   * Honeypot. Real users never see this field, but browser autofill sometimes
   * does — so it is accepted by validation and handled in the action instead.
   * Rejecting it here would show a real user an error with no visible cause.
   */
  website: z.string().max(200).optional().default(""),
});

export type PublicLeadInput = z.infer<typeof publicLeadSchema>;

/** Staff-side creation and editing, which may set privileged fields. */
export const leadSchema = z.object({
  name: nameField,
  phone: phoneField,
  email: optionalEmail,
  instagramHandle: z
    .string()
    .trim()
    .max(60, "Handle is too long")
    .transform((value) => value.replace(/^@/, ""))
    .default(""),
  fitnessGoal: z.string().trim().max(1000, "Please keep this shorter").default(""),
  interestedIn: z.enum(LEAD_INTERESTS, {
    message: "Choose an interest",
  }),
  source: z.enum(LEAD_SOURCES).default("manual"),
  status: z.enum(LEAD_STATUSES).default("new"),
  followUpDate: optionalDate,
  /** Set by the duplicate confirmation step to proceed anyway. */
  allowDuplicate: z.string().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const updateStatusSchema = z.object({
  leadId: z.string().trim().min(1),
  status: z.enum(LEAD_STATUSES),
});

export const setFollowUpSchema = z.object({
  leadId: z.string().trim().min(1),
  followUpDate: optionalDate,
});

export const addNoteSchema = z.object({
  leadId: z.string().trim().min(1),
  body: z
    .string()
    .trim()
    .min(1, "Write something first")
    .max(2000, "Note is too long"),
});

/** Query-string filters for the leads list. */
export const leadFilterSchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  interest: z.enum(LEAD_INTERESTS).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  due: z.enum(["overdue", "today", "week"]).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

export type LeadFilterInput = z.infer<typeof leadFilterSchema>;
