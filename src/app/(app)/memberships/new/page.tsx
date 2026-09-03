import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MembershipForm } from "@/components/memberships/membership-form";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getPerson, listPeople } from "@/lib/people/queries";
import { PersonPicker } from "@/components/payments/person-picker";
import { listActivePlans } from "@/lib/memberships/queries";
import {
  expiryFromDuration,
  todayInputValue,
} from "@/lib/memberships/dates";
import { createMembershipAction } from "@/lib/actions/memberships";
import type { MembershipCategory } from "@/lib/memberships/constants";

export const metadata: Metadata = { title: "New membership" };

export default async function NewMembershipPage({
  searchParams,
}: PageProps<"/memberships/new">) {
  await requireUser("/memberships/new");

  const params = await searchParams;
  const personId = typeof params.person === "string" ? params.person : "";
  const category =
    params.category === "personal_training" ? "personal_training" : "gym";

  const brand = await getBrandSettings();
  const person = personId ? await getPerson(personId) : null;

  // Reaching this page without a customer is a normal entry point — from the
  // member list, say — so offer a picker rather than a 404.
  if (!person) {
    const { people } = await listPeople({ page: 1 });
    return (
      <div className="space-y-5">
        <Link
          href="/members"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Memberships
        </Link>

        <PageHeader title="New membership" />

        <PersonPicker
          people={people}
          hrefFor={(id) => `/memberships/new?person=${id}`}
          description="Pick an existing customer, or add a new one — either way the membership attaches to a single customer record."
        />
      </div>
    );
  }

  const plans = await listActivePlans();
  const today = todayInputValue(brand.timezone);

  return (
    <div className="space-y-5">
      <Link
        href={`/people/${person.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        {person.name}
      </Link>

      <PageHeader title="New membership" />

      <MembershipForm
        action={createMembershipAction}
        personId={person.id}
        personName={person.name}
        plans={plans}
        currency={brand.currency}
        submitLabel="Create membership"
        cancelHref={`/people/${person.id}`}
        confirm={{
          title: `Add this membership for ${person.name}?`,
          description:
            "Creates the membership with the dates and price shown. You can edit or end it afterwards.",
          confirmLabel: "Add membership",
        }}
        defaults={{
          planId: "",
          planName: "",
          category: category as MembershipCategory,
          purchaseDate: today,
          startDate: today,
          // Opens on the 1-month preset; the picker changes it from there.
          expiryDate: expiryFromDuration(today, 1),
          price: "",
          notes: "",
        }}
      />
    </div>
  );
}
