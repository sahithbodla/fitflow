"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Check, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import { cn } from "@/lib/utils";
import { idleFormState } from "@/lib/actions/types";
import {
  addLeadNoteAction,
  archiveLeadAction,
  setFollowUpAction,
  updateLeadStatusAction,
} from "@/lib/actions/leads";
import {
  LEAD_STATUSES,
  LEAD_STATUS_CLASSES,
  LEAD_STATUS_LABELS,
  type LeadStatus,
} from "@/lib/leads/constants";

/** One-tap status switching — the most frequent action on this screen. */
export function StatusSwitcher({
  leadId,
  current,
}: {
  leadId: string;
  current: LeadStatus;
}) {
  const [state, formAction, isPending] = useActionState(
    updateLeadStatusAction,
    idleFormState,
  );
  // Visual only: which chip shows a spinner. Correctness comes from the
  // submitted button's own value.
  const [pendingStatus, setPendingStatus] = useState<LeadStatus | null>(null);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <input type="hidden" name="leadId" value={leadId} />

          <div className="flex flex-wrap gap-2">
            {LEAD_STATUSES.map((status) => {
              const active = status === current;
              const busy = isPending && pendingStatus === status;
              return (
                /*
                 * Each chip is a submit button carrying its own value, so the
                 * status travels with the submission itself. Setting state and
                 * then submitting would race the React commit.
                 */
                <button
                  key={status}
                  type="submit"
                  name="status"
                  value={status}
                  disabled={isPending || active}
                  aria-pressed={active}
                  onClick={() => setPendingStatus(status)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all disabled:opacity-60",
                    active
                      ? LEAD_STATUS_CLASSES[status]
                      : "border hover:bg-accent",
                  )}
                >
                  {busy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : active ? (
                    <Check className="size-3.5" />
                  ) : null}
                  {LEAD_STATUS_LABELS[status]}
                </button>
              );
            })}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function FollowUpControl({
  leadId,
  followUpDate,
}: {
  leadId: string;
  /** `yyyy-mm-dd` in the business timezone, or "". */
  followUpDate: string;
}) {
  const [state, formAction] = useActionState(setFollowUpAction, idleFormState);
  const [value, setValue] = useState(followUpDate);

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="text-muted-foreground size-4" />
          Follow-up
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="leadId" value={leadId} />

          <FormAlert state={state} />

          <div className="flex gap-2">
            <Input
              type="date"
              name="followUpDate"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              aria-label="Follow-up date"
              className="flex-1"
            />
            <SubmitButton pendingLabel="Saving…" className="shrink-0">
              Save
            </SubmitButton>
          </div>

          {followUpDate ? (
            <Button
              type="submit"
              name="clearFollowUp"
              value="yes"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              Clear reminder
            </Button>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

export function AddNoteForm({ leadId }: { leadId: string }) {
  const [state, formAction] = useActionState(addLeadNoteAction, idleFormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      if (state.message) toast.success(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} ref={formRef} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />

      <FormAlert state={state} />

      <Textarea
        name="body"
        rows={3}
        maxLength={2000}
        required
        placeholder="Called and left a voicemail…"
        aria-label="Add a note"
        aria-invalid={Boolean(state.fieldErrors?.body)}
      />

      {state.fieldErrors?.body ? (
        <p className="text-destructive text-xs" role="alert">
          {state.fieldErrors.body}
        </p>
      ) : null}

      <SubmitButton pendingLabel="Adding…" className="w-full sm:w-auto">
        Add note
      </SubmitButton>
    </form>
  );
}

export function ArchiveLeadButton({
  leadId,
  leadName,
}: {
  leadId: string;
  leadName: string;
}) {
  const [state, formAction] = useActionState(archiveLeadAction, idleFormState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state, router]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" />
          Archive lead
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive {leadName}?</AlertDialogTitle>
          <AlertDialogDescription>
            They&rsquo;ll be hidden from your leads list. Nothing is permanently
            deleted — the record and its history are kept.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="leadId" value={leadId} />
            <AlertDialogAction type="submit">Archive</AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
