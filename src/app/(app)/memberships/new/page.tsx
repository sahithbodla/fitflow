import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MembershipForm } from "@/components/memberships/membership-form";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getPerson } from "@/lib/people/queries";
import { listActivePlans } from "@/lib/memberships/queries";
import {
  addDaysToInputValue,
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
  if (!person) notFound();

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
        defaults={{
          planId: "",
          planName: "",
          category: category as MembershipCategory,
          purchaseDate: today,
          startDate: today,
          // A sensible starting point the user is expected to change.
          expiryDate: addDaysToInputValue(today, 30),
          price: "",
          notes: "",
        }}
      />
    </div>
  );
}
