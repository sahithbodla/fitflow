import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PaymentForm } from "@/components/payments/payment-form";
import { PersonPicker } from "@/components/payments/person-picker";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getPerson, listPeople } from "@/lib/people/queries";
import { listPersonMembershipOptions } from "@/lib/memberships/queries";
import { todayInputValue } from "@/lib/memberships/dates";

export const metadata: Metadata = { title: "Add payment" };

export default async function NewPaymentPage({
  searchParams,
}: PageProps<"/payments/new">) {
  await requireUser("/payments/new");

  const params = await searchParams;
  const personId = typeof params.person === "string" ? params.person : "";

  const brand = await getBrandSettings();
  const person = personId ? await getPerson(personId) : null;

  // Choosing the customer is the first step when we did not arrive from one.
  if (!person) {
    const { people } = await listPeople({ page: 1 });
    return (
      <div className="space-y-5">
        <Link
          href="/payments"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Payments
        </Link>
        <PageHeader title="Add payment" />
        <PersonPicker people={people} hrefFor={(id) => `/payments/new?person=${id}`} />
      </div>
    );
  }

  const membershipOptions = await listPersonMembershipOptions(person.id);

  return (
    <div className="space-y-5">
      <Link
        href="/payments"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Payments
      </Link>

      <PageHeader
        title="Add payment"
        description={`For ${person.name}.`}
      />

      <PaymentForm
        personId={person.id}
        membershipOptions={membershipOptions}
        currency={brand.currency}
        today={todayInputValue(brand.timezone)}
      />
    </div>
  );
}
