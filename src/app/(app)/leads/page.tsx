import Link from "next/link";
import type { Metadata } from "next";
import { ClipboardList, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { LeadCard } from "@/components/leads/lead-card";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getLeadStatusCounts, listLeads } from "@/lib/leads/queries";
import { leadFilterSchema } from "@/lib/validation/lead";
import { LeadFilters } from "./lead-filters";
import { LeadsTable } from "./leads-table";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  await requireUser("/leads");
  const brand = await getBrandSettings();
  const params = await searchParams;

  // Unknown or malformed query values fall back to "no filter" rather than
  // erroring — a stale bookmark should still show the list.
  const parsed = leadFilterSchema.safeParse(params);
  const filters = parsed.success ? parsed.data : leadFilterSchema.parse({});

  const [{ leads, total, page, pageCount }, statusCounts] = await Promise.all([
    listLeads(filters, brand.timezone),
    getLeadStatusCounts(),
  ]);

  const hasAnyLeads = (statusCounts.all ?? 0) > 0;
  const isFiltered = Boolean(
    filters.q || filters.status || filters.interest || filters.source || filters.due,
  );

  const buildPageHref = (target: number) => {
    const next = new URLSearchParams();
    if (filters.q) next.set("q", filters.q);
    if (filters.status) next.set("status", filters.status);
    if (filters.interest) next.set("interest", filters.interest);
    if (filters.source) next.set("source", filters.source);
    if (filters.due) next.set("due", filters.due);
    if (target > 1) next.set("page", String(target));
    const query = next.toString();
    return query ? `/leads?${query}` : "/leads";
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leads"
        description={
          hasAnyLeads
            ? `${statusCounts.all} in your pipeline`
            : "Everyone who has enquired about training."
        }
        actions={
          <Button
            asChild
            className="bg-brand text-brand-foreground hover:bg-brand-strong"
          >
            <Link href="/leads/new">
              <Plus className="size-4" />
              Add lead
            </Link>
          </Button>
        }
      />

      {hasAnyLeads ? <LeadFilters statusCounts={statusCounts} /> : null}

      {leads.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={Search}
            title="No leads match those filters"
            description="Try a different status, or clear the filters to see everyone."
            action={
              <Button asChild variant="outline">
                <Link href="/leads">Clear filters</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="No leads yet"
            description="Share your enquiry form, or add someone who walked in or called."
            action={
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  asChild
                  className="bg-brand text-brand-foreground hover:bg-brand-strong"
                >
                  <Link href="/leads/new">
                    <Plus className="size-4" />
                    Add your first lead
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/lead" target="_blank">
                    View enquiry form
                  </Link>
                </Button>
              </div>
            }
          />
        )
      ) : (
        <>
          {/* Cards on mobile, table from md up. */}
          <div className="space-y-2.5 md:hidden">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} timeZone={brand.timezone} />
            ))}
          </div>

          <div className="hidden md:block">
            <LeadsTable leads={leads} timeZone={brand.timezone} />
          </div>

          {pageCount > 1 ? (
            <nav
              className="flex items-center justify-between gap-3 pt-1"
              aria-label="Pagination"
            >
              <Button
                asChild={page > 1}
                variant="outline"
                size="sm"
                disabled={page <= 1}
              >
                {page > 1 ? (
                  <Link href={buildPageHref(page - 1)}>Previous</Link>
                ) : (
                  <span>Previous</span>
                )}
              </Button>

              <span className="text-muted-foreground text-sm">
                Page {page} of {pageCount} · {total} lead
                {total === 1 ? "" : "s"}
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
