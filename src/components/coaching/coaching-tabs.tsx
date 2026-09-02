import Link from "next/link";
import { cn } from "@/lib/utils";

export const COACHING_TABS = [
  { value: "overview", label: "Overview" },
  { value: "workouts", label: "Workouts" },
  { value: "diet", label: "Diet" },
  { value: "check-ins", label: "Check-ins" },
] as const;

export type CoachingTab = (typeof COACHING_TABS)[number]["value"];

export function parseCoachingTab(value: unknown): CoachingTab {
  return COACHING_TABS.some((tab) => tab.value === value)
    ? (value as CoachingTab)
    : "overview";
}

/**
 * Section navigation for the coaching workspace.
 *
 * Driven by the URL rather than client state, so a section is linkable, opens
 * correctly on refresh, and works before (or without) hydration.
 */
export function CoachingTabs({
  clientId,
  current,
}: {
  clientId: string;
  current: CoachingTab;
}) {
  return (
    <nav
      aria-label="Coaching sections"
      className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0"
    >
      {COACHING_TABS.map((tab) => {
        const active = tab.value === current;
        return (
          <Link
            key={tab.value}
            href={
              tab.value === "overview"
                ? `/coaching/${clientId}`
                : `/coaching/${clientId}?tab=${tab.value}`
            }
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors",
              active
                ? "border-brand text-brand font-medium"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
