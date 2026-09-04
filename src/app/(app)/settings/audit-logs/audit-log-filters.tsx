"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { AUDIT_ACTION_GROUPS, AUDIT_ENTITY_TYPES } from "@/lib/audit/actions";
import { AUDIT_ACTION_LABELS } from "@/lib/audit/summarize";

const ENTITY_LABELS: Record<string, string> = {
  lead: "Leads",
  membership: "Memberships",
  payment: "Payments",
  coachingClient: "Coaching",
  workoutPlan: "Workouts",
  dietPlan: "Diet plans",
  checkIn: "Check-ins",
};

export function AuditLogFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entityType = searchParams.get("entityType");
  const action = searchParams.get("action");
  const date = searchParams.get("date") ?? "";

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.replace(`/settings/audit-logs?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-3">
      <div
        className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        role="group"
        aria-label="Filter by entity type"
      >
        <button
          type="button"
          onClick={() => setParam("entityType", null)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
            !entityType ? "bg-brand text-brand-foreground border-brand" : "hover:bg-accent",
          )}
        >
          All
        </button>
        {AUDIT_ENTITY_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setParam("entityType", type)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors",
              entityType === type
                ? "bg-brand text-brand-foreground border-brand"
                : "hover:bg-accent",
            )}
          >
            {ENTITY_LABELS[type] ?? type}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={action ?? ""}
          onChange={(event) => setParam("action", event.target.value || null)}
          aria-label="Filter by action"
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
        >
          <option value="">All actions</option>
          {AUDIT_ACTION_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.actions.map((a) => (
                <option key={a} value={a}>
                  {AUDIT_ACTION_LABELS[a]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={(event) => setParam("date", event.target.value || null)}
          aria-label="Filter by date"
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
        />

        {entityType || action || date ? (
          <button
            type="button"
            onClick={() => router.replace("/settings/audit-logs", { scroll: false })}
            className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-2"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
