"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveCheckInAction } from "@/lib/actions/checkins";
import { idleFormState } from "@/lib/actions/types";

export function ArchiveCheckInButton({
  checkInId,
  clientId,
}: {
  checkInId: string;
  clientId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    archiveCheckInAction,
    idleFormState,
  );

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="checkInId" value={checkInId} />
      <input type="hidden" name="clientId" value={clientId} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={isPending}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Remove check-in</span>
      </Button>
    </form>
  );
}
