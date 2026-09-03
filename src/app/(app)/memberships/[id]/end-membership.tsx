"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, Trash2, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmSubmit } from "@/components/form/confirm-submit";
import { FormAlert } from "@/components/form/form-alert";
import {
  deleteMembershipAction,
  endMembershipAction,
} from "@/lib/actions/memberships";
import { idleFormState } from "@/lib/actions/types";

/**
 * Ending a membership early, and deleting it.
 *
 * Cancelling and terminating are deliberately separate: one is the member's
 * decision, the other is the business ending it over conduct. Both keep the
 * purchased dates intact. Deleting is a soft delete and is confirmed
 * separately because it removes the membership from every view.
 */
export function EndMembership({
  membershipId,
  personId,
  planName,
  alreadyEnded,
}: {
  membershipId: string;
  personId: string;
  planName: string;
  alreadyEnded: boolean;
}) {
  const [state, formAction] = useActionState(endMembershipAction, idleFormState);
  const [deleteState, deleteAction] = useActionState(
    deleteMembershipAction,
    idleFormState,
  );
  const [mode, setMode] = useState<"cancelled" | "terminated" | null>(null);

  useEffect(() => {
    // No need to reset `mode` here: on success the membership is ended, so
    // `alreadyEnded` becomes true and this whole branch stops rendering.
    if (state.status === "success" && state.message) toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  useEffect(() => {
    if (deleteState.status === "error" && deleteState.message) {
      toast.error(deleteState.message);
    }
  }, [deleteState]);

  return (
    <div className="space-y-3">
      {!alreadyEnded ? (
        mode === null ? (
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMode("cancelled")}
              className="text-muted-foreground hover:text-foreground w-full justify-start"
            >
              <Ban className="size-4" />
              Cancel membership
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMode("terminated")}
              className="text-muted-foreground hover:text-destructive w-full justify-start"
            >
              <UserX className="size-4" />
              Terminate membership
            </Button>
          </div>
        ) : (
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="membershipId" value={membershipId} />
            <input type="hidden" name="mode" value={mode} />

            <FormAlert state={state} />

            <p className="text-muted-foreground text-sm text-pretty">
              {mode === "terminated"
                ? "Ends this membership because the business is stopping it — a disciplinary issue, for example."
                : "Ends this membership because the member asked to stop."}{" "}
              The purchase, start and expiry dates are kept exactly as they are.
            </p>

            <Input
              name="reason"
              maxLength={500}
              placeholder={
                mode === "terminated"
                  ? "Reason (recommended)"
                  : "Reason (optional)"
              }
              aria-label="Reason"
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setMode(null)}
              >
                Keep it
              </Button>
              <ConfirmSubmit
                size="sm"
                destructive
                variant={mode === "terminated" ? "destructive" : "outline"}
                className="flex-1"
                title={
                  mode === "terminated"
                    ? `Terminate ${planName}?`
                    : `Cancel ${planName}?`
                }
                description={
                  mode === "terminated"
                    ? "The member loses access from now. The purchased dates are kept, and the termination is recorded against this membership."
                    : "The member loses access from now. The purchased dates are kept, and the cancellation is recorded against this membership."
                }
                confirmLabel={mode === "terminated" ? "Terminate" : "Cancel it"}
                cancelLabel="Go back"
              >
                {mode === "terminated" ? "Terminate" : "Cancel membership"}
              </ConfirmSubmit>
            </div>
          </form>
        )
      ) : null}

      <form action={deleteAction}>
        <input type="hidden" name="membershipId" value={membershipId} />
        <input type="hidden" name="personId" value={personId} />
        <ConfirmSubmit
          variant="ghost"
          size="sm"
          destructive
          className="text-muted-foreground hover:text-destructive w-full justify-start"
          title={`Delete ${planName}?`}
          description="This removes the membership from every view, including the customer's history and the member list. The record is retained in the database but nothing in the app will show it."
          confirmLabel="Delete"
        >
          <Trash2 className="size-4" />
          Delete membership
        </ConfirmSubmit>
      </form>
    </div>
  );
}
