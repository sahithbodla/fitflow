import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  CalendarRange,
  Pencil,
  RefreshCw,
  Receipt,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import {
  CategoryChip,
  MembershipStatusBadge,
} from "@/components/memberships/membership-badges";
import { PaymentRow } from "@/components/payments/payment-row";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import {
  getMembership,
  getRenewalChain,
  listMembershipPayments,
} from "@/lib/memberships/queries";
import {
  formatCurrency,
  formatDate,
  inSentence,
  relativeDayLabel,
} from "@/lib/dates";
import { todayInputValue } from "@/lib/memberships/dates";
import { MEMBERSHIP_CATEGORY_LABELS } from "@/lib/memberships/constants";
import { PaymentForm } from "@/components/payments/payment-form";
import { EndMembership } from "./end-membership";

/** How many payments the membership screen shows before linking out. */
const PAYMENT_PREVIEW_COUNT = 3;

export async function generateMetadata({
  params,
}: PageProps<"/memberships/[id]">): Promise<Metadata> {
  const { id } = await params;
  const brand = await getBrandSettings();
  const membership = await getMembership(id, brand.timezone);
  return { title: membership ? membership.planName : "Membership" };
}

export default async function MembershipDetailPage({
  params,
}: PageProps<"/memberships/[id]">) {
  const { id } = await params;
  await requireUser(`/memberships/${id}`);

  const brand = await getBrandSettings();
  const membership = await getMembership(id, brand.timezone);
  if (!membership) notFound();

  const [chain, payments] = await Promise.all([
    getRenewalChain(membership.id, brand.timezone),
    listMembershipPayments(membership.id),
  ]);

  const previewPayments = payments.slice(0, PAYMENT_PREVIEW_COUNT);

  const collected = payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const outstanding =
    membership.price !== null ? membership.price - collected : null;

  const canRenew =
    membership.status !== "cancelled" && membership.status !== "terminated";

  return (
    <div className="space-y-5">
      <Link
        href={`/people/${membership.personId}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        {membership.personName}
      </Link>

      <PageHeader
        title={membership.planName}
        description={MEMBERSHIP_CATEGORY_LABELS[membership.category]}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/memberships/${membership.id}/edit`}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>
            {canRenew ? (
              <Button
                asChild
                className="bg-brand text-brand-foreground hover:bg-brand-strong"
              >
                <Link href={`/memberships/${membership.id}/renew`}>
                  <RefreshCw className="size-4" />
                  Renew
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <MembershipStatusBadge status={membership.effective} />
        <CategoryChip category={membership.category} />
        <span className="text-muted-foreground text-sm">
          Expires{" "}
          {inSentence(relativeDayLabel(membership.expiryDate, brand.timezone))}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarRange className="text-muted-foreground size-4" />
                Period
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Purchased", value: membership.purchaseDate },
                { label: "Starts", value: membership.startDate },
                { label: "Expires", value: membership.expiryDate },
              ].map((row) => (
                <div key={row.label}>
                  <p className="text-muted-foreground text-xs">{row.label}</p>
                  <p className="mt-0.5 text-sm font-medium">
                    {formatDate(row.value, brand.timezone)}
                  </p>
                </div>
              ))}

              {membership.notes ? (
                <div className="sm:col-span-3">
                  <p className="text-muted-foreground text-xs">Notes</p>
                  <p className="mt-0.5 text-sm whitespace-pre-wrap">
                    {membership.notes}
                  </p>
                </div>
              ) : null}

              {membership.cancelledAt ? (
                <div className="sm:col-span-3">
                  <p className="text-muted-foreground text-xs">
                    {membership.status === "terminated"
                      ? "Terminated"
                      : "Cancelled"}
                  </p>
                  <p className="mt-0.5 text-sm">
                    {formatDate(membership.cancelledAt, brand.timezone)}
                    {membership.cancelledReason
                      ? ` — ${membership.cancelledReason}`
                      : ""}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Renewal history */}
          {chain.length > 1 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Renewal history</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-0">
                  {chain.map((period, index) => {
                    const isCurrent = period.id === membership.id;
                    const isLast = index === chain.length - 1;
                    return (
                      <li key={period.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span
                            className={
                              isCurrent
                                ? "bg-brand mt-1.5 size-2.5 shrink-0 rounded-full"
                                : "bg-muted-foreground/40 mt-1.5 size-2.5 shrink-0 rounded-full"
                            }
                            aria-hidden
                          />
                          {!isLast ? <span className="bg-border w-px flex-1" /> : null}
                        </div>

                        <div className={isLast ? "min-w-0 pb-1" : "min-w-0 pb-5"}>
                          <div className="flex flex-wrap items-center gap-2">
                            {isCurrent ? (
                              <span className="text-sm font-medium">
                                {period.planName}
                              </span>
                            ) : (
                              <Link
                                href={`/memberships/${period.id}`}
                                className="hover:text-brand text-sm font-medium transition-colors"
                              >
                                {period.planName}
                              </Link>
                            )}
                            <MembershipStatusBadge status={period.effective} />
                            {isCurrent ? (
                              <span className="text-muted-foreground text-xs">
                                (this one)
                              </span>
                            ) : null}
                          </div>
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            {formatDate(period.startDate, brand.timezone)} –{" "}
                            {formatDate(period.expiryDate, brand.timezone)}
                            {period.price !== null
                              ? ` · ${formatCurrency(period.price, brand.currency)}`
                              : ""}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
          ) : null}

          {/* Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="text-muted-foreground size-4" />
                Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {payments.length > 0 ? (
                <div className="space-y-2.5">
                  {/* A preview only — the customer's full history is one tap away. */}
                  {previewPayments.map((payment) => (
                    <PaymentRow
                      key={payment.id}
                      payment={payment}
                      timeZone={brand.timezone}
                      showPerson={false}
                    />
                  ))}

                  {payments.length > PAYMENT_PREVIEW_COUNT ? (
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/payments/${membership.personId}`}>
                        View all {payments.length} payments for{" "}
                        {membership.personName}
                      </Link>
                    </Button>
                  ) : null}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Nothing recorded against this membership yet.
                </p>
              )}

              <div className="border-t pt-5">
                <p className="mb-3 text-sm font-medium">Record a payment</p>
                <PaymentForm
                  personId={membership.personId}
                  membershipId={membership.id}
                  currency={brand.currency}
                  today={todayInputValue(brand.timezone)}
                  defaultAmount={
                    outstanding !== null && outstanding > 0
                      ? String(outstanding)
                      : undefined
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Money</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Row
                label="Price"
                value={
                  membership.price !== null
                    ? formatCurrency(membership.price, brand.currency)
                    : "Not set"
                }
              />
              <Row
                label="Collected"
                value={formatCurrency(collected, brand.currency)}
              />
              {outstanding !== null ? (
                <Row
                  label="Outstanding"
                  value={formatCurrency(Math.max(0, outstanding), brand.currency)}
                  emphasis={outstanding > 0}
                />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="text-muted-foreground size-4" />
                Member
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium">{membership.personName}</p>
              <p className="text-muted-foreground text-sm">
                {membership.personPhone}
              </p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/people/${membership.personId}`}>
                  Open customer
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <EndMembership
                membershipId={membership.id}
                personId={membership.personId}
                planName={membership.planName}
                alreadyEnded={
                  membership.status === "cancelled" ||
                  membership.status === "terminated"
                }
              />
            </CardContent>
          </Card>

          {membership.createdBy ? (
            <p className="text-muted-foreground/80 text-center text-xs">
              Added by {membership.createdBy}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span
        className={
          emphasis
            ? "text-sm font-semibold text-amber-700 dark:text-amber-400"
            : "text-sm font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}
