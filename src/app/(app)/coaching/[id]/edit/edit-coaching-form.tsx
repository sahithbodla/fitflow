"use client";

import {
  CoachingForm,
  type CoachingFormDefaults,
} from "../../coaching-form";
import { updateCoachingClientAction } from "@/lib/actions/coaching";

export function EditCoachingForm({
  clientId,
  personId,
  personName,
  defaults,
}: {
  clientId: string;
  personId: string;
  personName: string;
  defaults: CoachingFormDefaults;
}) {
  const action = updateCoachingClientAction.bind(null, clientId);

  return (
    <CoachingForm
      action={action}
      personId={personId}
      personName={personName}
      defaults={defaults}
      submitLabel="Save changes"
      cancelHref={`/coaching/${clientId}`}
    />
  );
}
