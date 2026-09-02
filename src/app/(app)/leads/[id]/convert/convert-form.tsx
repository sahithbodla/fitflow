"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Check, TriangleAlert, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/form/field";
import { FormAlert } from "@/components/form/form-alert";
import { SubmitButton } from "@/components/form/submit-button";
import { cn } from "@/lib/utils";
import { convertLeadAction } from "@/lib/actions/conversion";
import { idleFormState } from "@/lib/actions/types";
import {
  CONVERSION_TYPES,
  CONVERSION_TYPE_BLURBS,
  CONVERSION_TYPE_LABELS,
  type ConversionType,
} from "@/lib/people/constants";

export function ConvertForm({
  leadId,
  leadName,
  suggested,
  alreadyConverted,
  match,
}: {
  leadId: string;
  leadName: string;
  suggested: ConversionType;
  /** Destinations this lead has already been converted to. */
  alreadyConverted: ConversionType[];
  /** An existing customer who looks like the same person. */
  match: { id: string; name: string; phone: string } | null;
}) {
  const [state, formAction] = useActionState(convertLeadAction, idleFormState);
  const [type, setType] = useState<ConversionType>(suggested);
  const [linkPerson, setLinkPerson] = useState(Boolean(match));

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="type" value={type} />
      <input
        type="hidden"
        name="linkPersonId"
        value={linkPerson && match ? match.id : ""}
      />

      <FormAlert state={state} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Convert to</CardTitle>
          <CardDescription>
            {leadName} stays in your leads with their full history — this
            creates their customer record.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {CONVERSION_TYPES.map((option) => {
            const done = alreadyConverted.includes(option);
            const selected = type === option;
            return (
              <button
                key={option}
                type="button"
                disabled={done}
                aria-pressed={selected}
                onClick={() => setType(option)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                  selected && !done && "border-brand bg-brand-soft",
                  done && "opacity-55",
                  !done && !selected && "hover:bg-accent/50",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2",
                    selected && !done
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-muted-foreground/40",
                  )}
                  aria-hidden
                >
                  {selected && !done ? <Check className="size-3" /> : null}
                </span>

                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {CONVERSION_TYPE_LABELS[option]}
                    {done ? " · already converted" : ""}
                  </span>
                  <span className="text-muted-foreground block text-xs text-pretty">
                    {done
                      ? "This lead has already been converted to this."
                      : CONVERSION_TYPE_BLURBS[option]}
                  </span>
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {match ? (
        <Alert>
          <TriangleAlert className="size-4" />
          <AlertTitle>You may already have this customer</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              {match.name} ({match.phone}) is already a customer. Attaching this
              conversion to them keeps one record per person.
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setLinkPerson(true)}
                aria-pressed={linkPerson}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors",
                  linkPerson ? "border-brand bg-brand-soft" : "hover:bg-accent/50",
                )}
              >
                <Users className="size-4 shrink-0" aria-hidden />
                Attach to {match.name}
              </button>

              <button
                type="button"
                onClick={() => setLinkPerson(false)}
                aria-pressed={!linkPerson}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border p-3 text-left text-sm transition-colors",
                  !linkPerson ? "border-brand bg-brand-soft" : "hover:bg-accent/50",
                )}
              >
                <UserPlus className="size-4 shrink-0" aria-hidden />
                Create a separate customer record
              </button>
            </div>

            <Button asChild size="sm" variant="ghost" className="px-0">
              <Link href={`/people/${match.id}`}>View {match.name}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Note</CardTitle>
          <CardDescription>
            Optional. Recorded against the conversion and the lead&rsquo;s
            history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field id="notes" label="Conversion note" error={state.fieldErrors?.notes}>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              maxLength={2000}
              placeholder="Agreed on a 3-month plan starting Monday…"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <SubmitButton pendingLabel="Converting…" className="w-full sm:w-auto">
          Convert {leadName}
        </SubmitButton>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={`/leads/${leadId}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
