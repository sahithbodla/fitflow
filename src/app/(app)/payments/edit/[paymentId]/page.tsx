import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PaymentForm } from "@/components/payments/payment-form";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import {
  getPayment,
  listPersonMembershipOptions,
} from "@/lib/memberships/queries";
import { toDateInputValue, todayInputValue } from "@/lib/memberships/dates";

export const metadata: Metadata = { title: "Edit payment" };

export default async function EditPaymentPage({
  params,
}: PageProps<"/payments/edit/[paymentId]">) {
  const { paymentId } = await params;
  await requireUser(`/payments/edit/${paymentId}`);

  const brand = await getBrandSettings();
  const payment = await getPayment(paymentId);
  if (!payment) notFound();

  const membershipOptions = await listPersonMembershipOptions(payment.personId);

  return (
    <div className="space-y-5">
      <Link
        href={`/payments/${payment.personId}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        {payment.personName}
      </Link>

      <PageHeader
        title="Edit payment"
        description={`For ${payment.personName}.`}
      />

      <PaymentForm
        paymentId={payment.id}
        personId={payment.personId}
        membershipOptions={membershipOptions}
        currency={brand.currency}
        today={todayInputValue(brand.timezone)}
        submitLabel="Save payment"
        defaults={{
          amount: String(payment.amount),
          paymentDate: toDateInputValue(payment.paymentDate, brand.timezone),
          method: payment.method,
          status: payment.status,
          notes: payment.notes,
          membershipId: payment.membershipId ?? "",
        }}
      />
    </div>
  );
}
