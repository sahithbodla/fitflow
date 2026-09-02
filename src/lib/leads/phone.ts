/**
 * Phone handling for duplicate detection.
 *
 * Numbers are entered inconsistently — "+91 98765 43210", "098765 43210" and
 * "9876543210" are all the same person. We store the raw input for display and
 * a normalised form for matching: digits only, and for long numbers the last 10
 * digits, which drops country and trunk prefixes without pulling in a full
 * phone-number library.
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length <= 10) return digits;
  return digits.slice(-10);
}

/** Loose validity check — permissive on formatting, strict on digit count. */
export function isPlausiblePhone(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/** Strips formatting for use in `tel:` links. */
export function telHref(input: string): string {
  return input.replace(/[^\d+]/g, "");
}

export function whatsAppHref(input: string): string {
  return `https://wa.me/${input.replace(/\D/g, "")}`;
}
