import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getMembership, listActivePlans } from "@/lib/memberships/queries";
import { toDateInputValue } from "@/lib/memberships/dates";
import { EditMembershipForm } from "./edit-membership-form";

export const metadata: Metadata = { title: "Edit membership" };

export default async function EditMembershipPage({
  params,
}: PageProps<"/memberships/[id]/edit">) {
  const { id } = await params;
  await requireUser(`/memberships/${id}/edit`);

  const brand = await getBrandSettings();
  const membership = await getMembership(id, brand.timezone);
  if (!membership) notFound();

  const plans = await listActivePlans();

  return (
    <div className="space-y-5">
      <Link
        href={`/memberships/${membership.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        {membership.planName}
      </Link>

      <PageHeader
        title="Edit membership"
        description="Correcting a mistake. To extend a membership, use Renew instead — that keeps the history."
      />

      <EditMembershipForm
        membershipId={membership.id}
        personId={membership.personId}
        personName={membership.personName}
        plans={plans}
        currency={brand.currency}
        defaults={{
          planId: membership.planId ?? "",
          planName: membership.planName,
          category: membership.category,
          purchaseDate: toDateInputValue(membership.purchaseDate, brand.timezone),
          startDate: toDateInputValue(membership.startDate, brand.timezone),
          expiryDate: toDateInputValue(membership.expiryDate, brand.timezone),
          price: membership.price !== null ? String(membership.price) : "",
          notes: membership.notes,
        }}
      />
    </div>
  );
}
