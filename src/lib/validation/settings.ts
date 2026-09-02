import { z } from "zod";
import { isHexColor } from "@/lib/colors";
import { isValidTimeZone } from "@/lib/dates";

const hexColor = z
  .string()
  .trim()
  .refine(isHexColor, "Use a hex colour such as #2563eb");

const optionalText = (max: number) =>
  z.string().trim().max(max, `Must be ${max} characters or fewer`).default("");

export const businessSettingsSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Business name must be at least 2 characters")
    .max(120, "Business name is too long"),
  tagline: optionalText(200),
  logoUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) => value === "" || /^https?:\/\/.+/i.test(value),
      "Enter a full URL starting with http:// or https://",
    )
    .default(""),
  primaryColor: hexColor,
  accentColor: hexColor,
  contactEmail: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      (value) => value === "" || z.string().email().safeParse(value).success,
      "Enter a valid email address",
    )
    .default(""),
  contactPhone: optionalText(30),
  whatsappNumber: optionalText(30),
  instagramHandle: optionalText(60),
  addressLine: optionalText(300),
  city: optionalText(120),
  timezone: z
    .string()
    .trim()
    .refine(isValidTimeZone, "Select a valid timezone")
    .default("Asia/Kolkata"),
  currency: z
    .string()
    .trim()
    .min(1, "Currency code is required")
    .max(8, "Currency code is too long")
    .toUpperCase()
    .default("INR"),
});

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;
