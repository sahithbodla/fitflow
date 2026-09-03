import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/layout/page-header";
import { MembershipForm } from "@/components/memberships/membership-form";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getMembership, listActivePlans } from "@/lib/memberships/queries";
import {
  DURATION_PRESETS,
  addDaysToInputValue,
  durationForRange,
  expiryFromDuration,
  toDateInputValue,
  todayInputValue,
} from "@/lib/memberships/dates";
import { createMembershipAction } from "@/lib/actions/memberships";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Renew membership" };

export default async function RenewMembershipPage({
  params,
}: PageProps<"/memberships/[id]/renew">) {
  const { id } = await params;
  await requireUser(`/memberships/${id}/renew`);

  const brand = await getBrandSettings();
  const previous = await getMembership(id, brand.timezone);
  if (!previous) notFound();

  const plans = await listActivePlans();

  // The new period picks up where the old one ends, which is what renewing
  // means. Every date stays editable.
  const dayAfterExpiry = addDaysToInputValue(
    toDateInputValue(previous.expiryDate, brand.timezone),
    1,
  );
  const today = todayInputValue(brand.timezone);
  const start = dayAfterExpiry > today ? dayAfterExpiry : today;

  // Match the previous period's length. When it corresponds to one of the
  // presets the renewal reopens on that option; otherwise the exact day count
  // is carried over and the form shows Custom.
  const previousStart = toDateInputValue(previous.startDate, brand.timezone);
  const previousExpiry = toDateInputValue(previous.expiryDate, brand.timezone);
  const previousDuration = durationForRange(previousStart, previousExpiry);
  const preset = DURATION_PRESETS.find(
    (option) => option.value === previousDuration,
  );

  const previousLengthDays = Math.max(
    1,
    Math.round(
      (new Date(previous.expiryDate).getTime() -
        new Date(previous.startDate).getTime()) /
        86_400_000,
    ),
  );

  const renewalExpiry = preset
    ? expiryFromDuration(start, preset.months)
    : addDaysToInputValue(start, previousLengthDays);

  return (
    <div className="space-y-5">
      <Link
        href={`/memberships/${previous.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        {previous.planName}
      </Link>

      <PageHeader
        title="Renew membership"
        description={`A new period for ${previous.personName}.`}
      />

      <Alert>
        <Info className="size-4" />
        <AlertDescription>
          This creates a new membership period linked to the current one. The
          existing membership keeps its dates ({" "}
          {formatDate(previous.startDate, brand.timezone)} –{" "}
          {formatDate(previous.expiryDate, brand.timezone)} ) and stays in the
          history.
        </AlertDescription>
      </Alert>

      <MembershipForm
        action={createMembershipAction}
        personId={previous.personId}
        personName={previous.personName}
        plans={plans}
        currency={brand.currency}
        renewedFrom={previous.id}
        submitLabel="Create renewal"
        cancelHref={`/memberships/${previous.id}`}
        defaults={{
          planId: previous.planId ?? "",
          planName: previous.planName,
          category: previous.category,
          purchaseDate: today,
          startDate: start,
          expiryDate: renewalExpiry,
          price: previous.price !== null ? String(previous.price) : "",
          notes: "",
        }}
      />
    </div>
  );
}
