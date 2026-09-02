"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cancelMembershipAction } from "@/lib/actions/memberships";
import { idleFormState } from "@/lib/actions/types";

/**
 * Cancelling is a two-step confirm rather than a dialog, so it works without
 * JavaScript and cannot be triggered by a single stray tap.
 */
export function CancelMembership({ membershipId }: { membershipId: string }) {
  const [state, formAction] = useActionState(
    cancelMembershipAction,
    idleFormState,
  );
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(true)}
        className="text-muted-foreground hover:text-destructive w-full"
      >
        <Ban className="size-4" />
        Cancel membership
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="membershipId" value={membershipId} />

      <p className="text-muted-foreground text-sm text-pretty">
        The purchase, start and expiry dates are kept exactly as they are — this
        only marks the membership cancelled.
      </p>

      <Input
        name="reason"
        maxLength={500}
        placeholder="Reason (optional)"
        aria-label="Cancellation reason"
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setConfirming(false)}
        >
          Keep it
        </Button>
        <Button type="submit" variant="destructive" size="sm" className="flex-1">
          Cancel membership
        </Button>
      </div>
    </form>
  );
}
