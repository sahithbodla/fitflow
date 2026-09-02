import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { CoachingStatusBadge } from "@/components/people/person-badges";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import {
  getCoachingStatusCounts,
  listCoachingClients,
} from "@/lib/coaching/queries";
import { coachingFilterSchema } from "@/lib/validation/coaching";
import { formatDate } from "@/lib/dates";
import { CoachingFilters } from "./coaching-filters";

export const metadata: Metadata = { title: "Online coaching" };

export default async function CoachingPage({
  searchParams,
}: PageProps<"/coaching">) {
  await requireUser("/coaching");
  const brand = await getBrandSettings();
  const params = await searchParams;

  const parsed = coachingFilterSchema.safeParse(params);
  const filters = parsed.success ? parsed.data : coachingFilterSchema.parse({});

  const [{ clients, total, page, pageCount }, counts] = await Promise.all([
    listCoachingClients(filters),
    getCoachingStatusCounts(),
  ]);

  const hasAny = (counts.all ?? 0) > 0;
  const isFiltered = Boolean(filters.q || filters.status);

  const buildPageHref = (target: number) => {
    const next = new URLSearchParams();
    if (filters.q) next.set("q", filters.q);
    if (filters.status) next.set("status", filters.status);
    if (target > 1) next.set("page", String(target));
    const query = next.toString();
    return query ? `/coaching?${query}` : "/coaching";
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Online coaching"
        description={
          hasAny
            ? `${total} ${total === 1 ? "client" : "clients"}`
            : "Clients you program and check in with remotely."
        }
      />

      {hasAny ? <CoachingFilters counts={counts} /> : null}

      {clients.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={Search}
            title="No clients match those filters"
            description="Try a different status, or clear the search."
            action={
              <Button asChild variant="outline">
                <Link href="/coaching">Clear filters</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No coaching clients yet"
            description="Convert a lead to online coaching, or start coaching for an existing customer from their profile."
            action={
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  asChild
                  className="bg-brand text-brand-foreground hover:bg-brand-strong"
                >
                  <Link href="/people">Go to customers</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/leads">Go to leads</Link>
                </Button>
              </div>
            }
          />
        )
      ) : (
        <>
          <div className="space-y-2.5">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/coaching/${client.id}`}
                className="bg-card hover:bg-accent/40 flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{client.personName}</p>
                    <CoachingStatusBadge status={client.status} />
                  </div>

                  <p className="text-muted-foreground mt-1 truncate text-sm">
                    {client.personPhone}
                  </p>

                  {client.goal ? (
                    <p className="text-muted-foreground/80 mt-1 line-clamp-1 text-xs">
                      {client.goal}
                    </p>
                  ) : null}

                  <p className="text-muted-foreground/80 mt-1 text-xs">
                    Since {formatDate(client.startDate, brand.timezone)}
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
