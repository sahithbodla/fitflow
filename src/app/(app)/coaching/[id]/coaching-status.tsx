"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateCoachingStatusAction } from "@/lib/actions/coaching";
import { idleFormState } from "@/lib/actions/types";
import {
  COACHING_STATUSES,
  COACHING_STATUS_CLASSES,
  COACHING_STATUS_LABELS,
  type CoachingStatus,
} from "@/lib/people/constants";

/** One-tap status switching. Each chip submits its own value. */
export function CoachingStatusSwitcher({
  clientId,
  current,
}: {
  clientId: string;
  current: CoachingStatus;
}) {
  const [state, formAction, isPending] = useActionState(
    updateCoachingStatusAction,
    idleFormState,
  );

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-wrap gap-2">
      <input type="hidden" name="clientId" value={clientId} />

      {COACHING_STATUSES.map((status) => {
        const active = status === current;
        return (
          <button
            key={status}
            type="submit"
            name="status"
            value={status}
            disabled={isPending || active}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all disabled:opacity-60",
              active ? COACHING_STATUS_CLASSES[status] : "border hover:bg-accent",
            )}
          >
            {isPending && !active ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : active ? (
              <Check className="size-3.5" />
            ) : null}
            {COACHING_STATUS_LABELS[status]}
          </button>
        );
      })}
    </form>
  );
}
