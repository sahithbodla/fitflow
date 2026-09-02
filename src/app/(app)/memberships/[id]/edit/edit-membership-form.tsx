"use client";

import {
  MembershipForm,
  type MembershipFormDefaults,
} from "@/components/memberships/membership-form";
import { updateMembershipAction } from "@/lib/actions/memberships";
import type { PlanListItem } from "@/lib/memberships/queries";

export function EditMembershipForm({
  membershipId,
  personId,
  personName,
  plans,
  currency,
  defaults,
}: {
  membershipId: string;
  personId: string;
  personName: string;
  plans: PlanListItem[];
  currency: string;
  defaults: MembershipFormDefaults;
}) {
  const action = updateMembershipAction.bind(null, membershipId);

  return (
    <MembershipForm
      action={action}
      personId={personId}
      personName={personName}
      plans={plans}
      currency={currency}
      defaults={defaults}
      submitLabel="Save changes"
      cancelHref={`/memberships/${membershipId}`}
    />
  );
}
