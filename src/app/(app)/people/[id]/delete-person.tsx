"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Lock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmSubmit } from "@/components/form/confirm-submit";
import { deletePersonAction } from "@/lib/actions/conversion";
import { idleFormState } from "@/lib/actions/types";

/**
 * Deleting a customer, refused while a membership is still running.
 *
 * The block is enforced in the action too — this only explains it up front and
 * links to the memberships standing in the way, so the fix is one tap rather
 * than a hunt.
 */
export function DeletePerson({
  personId,
  personName,
  blocking,
}: {
  personId: string;
  personName: string;
  blocking: { id: string; planName: string }[];
}) {
  const [state, formAction] = useActionState(deletePersonAction, idleFormState);

  useEffect(() => {
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  if (blocking.length > 0) {
    return (
      <Alert>
        <Lock className="size-4" />
        <AlertDescription className="space-y-3">
          <p>
            {personName} can&rsquo;t be deleted while{" "}
            {blocking.length === 1
              ? "a membership is still running"
              : `${blocking.length} memberships are still running`}
            . End or delete{" "}
            {blocking.length === 1 ? "it" : "them"} first.
          </p>
          <div className="flex flex-col gap-1.5">
            {blocking.map((membership) => (
              <Button
                key={membership.id}
                asChild
                size="sm"
                variant="outline"
                className="justify-start"
              >
                <Link href={`/memberships/${membership.id}`}>
                  {membership.planName}
                </Link>
              </Button>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="personId" value={personId} />
      <ConfirmSubmit
        variant="ghost"
        size="sm"
        destructive
        className="text-muted-foreground hover:text-destructive w-full justify-start"
        title={`Delete ${personName}?`}
        description="This removes them from your customer list along with their history in the app. Past memberships and payments stay in the database but nothing will show them."
        confirmLabel="Delete customer"
      >
        <Trash2 className="size-4" />
        Delete customer
      </ConfirmSubmit>
    </form>
  );
}
