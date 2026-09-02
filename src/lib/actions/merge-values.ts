import type { FormState } from "@/lib/actions/types";

/**
 * Merges the values echoed back by a failed action over a form's defaults.
 *
 * React resets uncontrolled inputs once a form action settles, so re-rendering
 * with plain defaults would silently discard whatever the user typed.
 */
export function withSubmittedValues<T extends Record<string, string>>(
  defaults: T,
  state: FormState,
): T {
  if (!state.values) return defaults;
  const merged = { ...defaults };
  for (const [key, value] of Object.entries(state.values)) {
    if (key in merged) (merged as Record<string, string>)[key] = value;
  }
  return merged;
}
