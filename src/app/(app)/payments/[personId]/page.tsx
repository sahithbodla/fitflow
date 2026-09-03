import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { PaymentRow } from "@/components/payments/payment-row";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getPerson } from "@/lib/people/queries";
import { listPersonPayments } from "@/lib/memberships/queries";
import { formatCurrency } from "@/lib/dates";

export async function generateMetadata({
  params,
}: PageProps<"/payments/[personId]">): Promise<Metadata> {
  const { personId } = await params;
  const person = await getPerson(personId);
  return { title: person ? `${person.name} · Payments` : "Payments" };
}

/** Every payment for one customer. */
export default async function CustomerPaymentsPage({
  params,
}: PageProps<"/payments/[personId]">) {
  const { personId } = await params;
  await requireUser(`/payments/${personId}`);

  const [person, brand] = await Promise.all([
    getPerson(personId),
    getBrandSettings(),
  ]);
  if (!person) notFound();

  const payments = await listPersonPayments(person.id);
  const collected = payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-5">
      <Link
        href={`/people/${person.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        {person.name}
      </Link>

      <PageHeader
        title="Payments"
        description={`Everything recorded for ${person.name}.`}
        actions={
          <Button
            asChild
            className="bg-brand text-brand-foreground hover:bg-brand-strong"
          >
            <Link href={`/payments/new?person=${person.id}`}>
              <Plus className="size-4" />
              Add payment
            </Link>
          </Button>
        }
      />

      {payments.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No payments recorded"
          description={`Nothing has been recorded for ${person.name} yet.`}
          action={
            <Button
              asChild
              className="bg-brand text-brand-foreground hover:bg-brand-strong"
            >
              <Link href={`/payments/new?person=${person.id}`}>
                Add the first one
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <Card className="py-4">
            <CardContent className="px-4">
              <p className="text-muted-foreground text-xs">Total received</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {formatCurrency(collected, brand.currency)}
              </p>
              <p className="text-muted-foreground/80 mt-1 text-xs">
                Across {payments.length} record
                {payments.length === 1 ? "" : "s"}, excluding pending and
                refunded.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-2.5">
            {payments.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                timeZone={brand.timezone}
                showPerson={false}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
