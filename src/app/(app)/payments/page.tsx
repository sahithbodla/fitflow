import Link from "next/link";
import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { PaymentStatusBadge } from "@/components/memberships/membership-badges";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { listPayments } from "@/lib/memberships/queries";
import { paymentFilterSchema } from "@/lib/validation/membership";
import { formatCurrency, formatDate } from "@/lib/dates";
import { PAYMENT_METHOD_LABELS } from "@/lib/memberships/constants";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage({
  searchParams,
}: PageProps<"/payments">) {
  await requireUser("/payments");
  const brand = await getBrandSettings();
  const params = await searchParams;

  const parsed = paymentFilterSchema.safeParse(params);
  const filters = parsed.success ? parsed.data : paymentFilterSchema.parse({});

  const { payments, total, page, pageCount, totalAmount } =
    await listPayments(filters);

  const buildPageHref = (target: number) => {
    const next = new URLSearchParams();
    if (filters.q) next.set("q", filters.q);
    if (filters.method) next.set("method", filters.method);
    if (target > 1) next.set("page", String(target));
    const query = next.toString();
    return query ? `/payments?${query}` : "/payments";
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments"
        description="Manually recorded — there is no payment gateway in this MVP."
      />

      {payments.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No payments recorded"
          description="Record payments from a membership, so each one is tied to what it paid for."
          action={
            <Button asChild variant="outline">
              <Link href="/members">Go to memberships</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Card className="py-4">
            <CardContent className="px-4">
              <p className="text-muted-foreground text-xs">
                Total received{filters.method || filters.q ? " (filtered)" : ""}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {formatCurrency(totalAmount, brand.currency)}
              </p>
              <p className="text-muted-foreground/80 mt-1 text-xs">
                Across {total} payment{total === 1 ? "" : "s"}, excluding pending
                and refunded.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-2.5">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="bg-card flex items-start justify-between gap-3 rounded-xl border px-4 py-3.5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/people/${payment.personId}`}
                      className="hover:text-brand font-medium transition-colors"
                    >
                      {payment.personName}
                    </Link>
                    <PaymentStatusBadge status={payment.status} />
                  </div>

                  <p className="text-muted-foreground mt-1 text-sm">
                    {formatDate(payment.paymentDate, brand.timezone)} ·{" "}
                    {PAYMENT_METHOD_LABELS[payment.method]}
                  </p>

                  {payment.membershipId && payment.membershipLabel ? (
                    <Link
                      href={`/memberships/${payment.membershipId}`}
                      className="text-brand mt-0.5 inline-block text-xs hover:underline"
                    >
                      {payment.membershipLabel}
                    </Link>
                  ) : null}

                  {payment.notes ? (
                    <p className="text-muted-foreground/80 mt-1 text-xs text-pretty">
                      {payment.notes}
                    </p>
                  ) : null}
                </div>

                <p className="shrink-0 font-semibold tabular-nums">
                  {formatCurrency(payment.amount, payment.currency)}
                </p>
              </div>
            ))}
          </div>

          {pageCount > 1 ? (
            <nav
              className="flex items-center justify-between gap-3 pt-1"
              aria-label="Pagination"
            >
              <Button asChild={page > 1} variant="outline" size="sm" disabled={page <= 1}>
                {page > 1 ? (
                  <Link href={buildPageHref(page - 1)}>Previous</Link>
                ) : (
                  <span>Previous</span>
                )}
              </Button>
              <span className="text-muted-foreground text-sm">
                Page {page} of {pageCount}
              </span>
              <Button
                asChild={page < pageCount}
                variant="outline"
                size="sm"
                disabled={page >= pageCount}
              >
                {page < pageCount ? (
                  <Link href={buildPageHref(page + 1)}>Next</Link>
                ) : (
                  <span>Next</span>
                )}
              </Button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
