"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A submit button that asks for confirmation first.
 *
 * The button is a real `type="submit"` inside its form and only prevents the
 * default in its click handler. So when JavaScript is available the dialog
 * opens; if it is not, the click submits directly. The worst case is losing
 * the confirmation step, never losing the action itself.
 */
export function ConfirmSubmit({
  children,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  variant,
  size,
  className,
  destructive,
  pendingLabel,
  name,
  value,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  destructive?: boolean;
  pendingLabel?: string;
  /** Forwarded to the real submit so submitter name/value still travels. */
  name?: string;
  value?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { pending } = useFormStatus();

  return (
    <>
      <Button
        ref={triggerRef}
        type="submit"
        name={name}
        value={value}
        variant={variant}
        size={size}
        disabled={pending}
        onClick={(event) => {
          // Only intercept when we can actually show the dialog.
          event.preventDefault();
          setOpen(true);
        }}
        className={cn(
          !variant &&
            !destructive &&
            "bg-brand text-brand-foreground hover:bg-brand-strong",
          className,
        )}
      >
        {pending && pendingLabel ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {pendingLabel}
          </>
        ) : (
          children
        )}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction
              className={
                destructive
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : undefined
              }
              onClick={() => {
                setOpen(false);
                // Submit through the real button so its name/value is included
                // as the submitter, exactly as a direct click would be.
                const button = triggerRef.current;
                const form = button?.form;
                if (form && button) {
                  form.requestSubmit(button);
                }
              }}
            >
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
