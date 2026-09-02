import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import {
  CategoryChip,
  MembershipStatusBadge,
} from "@/components/memberships/membership-badges";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import {
  getMembershipStateCounts,
  listMemberships,
} from "@/lib/memberships/queries";
import { memberFilterSchema } from "@/lib/validation/membership";
import { formatCurrency, formatDate, relativeDayLabel } from "@/lib/dates";
import { MemberFilters } from "./member-filters";

export const metadata: Metadata = { title: "Memberships" };

export default async function MembersPage({
  searchParams,
}: PageProps<"/members">) {
  await requireUser("/members");
  const brand = await getBrandSettings();
  const params = await searchParams;

  const parsed = memberFilterSchema.safeParse(params);
  const filters = parsed.success ? parsed.data : memberFilterSchema.parse({});

  const [{ memberships, total, page, pageCount }, counts] = await Promise.all([
    listMemberships(filters, brand.timezone),
    getMembershipStateCounts(brand.timezone),
  ]);

  const hasAny = (counts.all ?? 0) > 0;
  const isFiltered = Boolean(filters.q || filters.state || filters.category);

  const buildPageHref = (target: number) => {
    const next = new URLSearchParams();
    if (filters.q) next.set("q", filters.q);
    if (filters.state) next.set("state", filters.state);
    if (filters.category) next.set("category", filters.category);
    if (target > 1) next.set("page", String(target));
    const query = next.toString();
    return query ? `/members?${query}` : "/members";
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Memberships"
        description={
          hasAny
            ? `${total} ${total === 1 ? "membership" : "memberships"}`
            : "Gym and personal-training memberships."
        }
      />

      {hasAny ? <MemberFilters counts={counts} /> : null}

      {memberships.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={Search}
            title="No memberships match those filters"
            description="Try a different state, or clear the filters."
            action={
              <Button asChild variant="outline">
                <Link href="/members">Clear filters</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Users}
            title="No memberships yet"
            description="Open a customer and add their gym or personal-training membership."
            action={
              <Button
                asChild
                className="bg-brand text-brand-foreground hover:bg-brand-strong"
              >
                <Link href="/people">Go to customers</Link>
              </Button>
            }
          />
        )
      ) : (
        <>
          <div className="space-y-2.5">
            {memberships.map((membership) => (
              <Link
                key={membership.id}
                href={`/memberships/${membership.id}`}
                className="bg-card hover:bg-accent/40 flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">
                      {membership.personName}
                    </p>
                    <MembershipStatusBadge status={membership.effective} />
                    <CategoryChip category={membership.category} />
                  </div>

                  <p className="text-muted-foreground mt-1 truncate text-sm">
                    {membership.planName}
                  </p>

                  <p className="text-muted-foreground/80 mt-1 text-xs">
                    {formatDate(membership.startDate, brand.timezone)} –{" "}
                    {formatDate(membership.expiryDate, brand.timezone)} ·{" "}
                    {relativeDayLabel(membership.expiryDate, brand.timezone)}
                    {membership.price !== null
                      ? ` · ${formatCurrency(membership.price, brand.currency)}`
                      : ""}
                  </p>
                </div>

                <ChevronRight
                  className="text-muted-foreground size-4 shrink-0"
                  aria-hidden
                />
              </Link>
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
