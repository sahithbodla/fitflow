import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, Mail, Phone, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { PersonTypeChip } from "@/components/people/person-badges";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getPeopleTypeCounts, listPeople } from "@/lib/people/queries";
import { peopleFilterSchema } from "@/lib/validation/conversion";
import { formatDate } from "@/lib/dates";
import { PeopleFilters } from "./people-filters";

export const metadata: Metadata = { title: "Customers" };

export default async function PeoplePage({
  searchParams,
}: PageProps<"/people">) {
  await requireUser("/people");
  const brand = await getBrandSettings();
  const params = await searchParams;

  const parsed = peopleFilterSchema.safeParse(params);
  const filters = parsed.success ? parsed.data : peopleFilterSchema.parse({});

  const [{ people, total, page, pageCount }, typeCounts] = await Promise.all([
    listPeople(filters),
    getPeopleTypeCounts(),
  ]);

  const hasAnyone = (typeCounts.all ?? 0) > 0;
  const isFiltered = Boolean(filters.q || filters.type);

  const buildPageHref = (target: number) => {
    const next = new URLSearchParams();
    if (filters.q) next.set("q", filters.q);
    if (filters.type) next.set("type", filters.type);
    if (target > 1) next.set("page", String(target));
    const query = next.toString();
    return query ? `/people?${query}` : "/people";
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        description={
          hasAnyone
            ? `${total} ${total === 1 ? "person" : "people"}`
            : "Members, PT clients and coaching clients."
        }
      />

      {hasAnyone ? <PeopleFilters typeCounts={typeCounts} /> : null}

      {people.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={Search}
            title="Nobody matches those filters"
            description="Try a different type, or clear the search."
            action={
              <Button asChild variant="outline">
                <Link href="/people">Clear filters</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Customers are created when you convert a lead. Open a lead and choose Convert."
            action={
              <Button
                asChild
                className="bg-brand text-brand-foreground hover:bg-brand-strong"
              >
                <Link href="/leads">Go to leads</Link>
              </Button>
            }
          />
        )
      ) : (
        <>
          <div className="space-y-2.5">
            {people.map((person) => (
              <Link
                key={person.id}
                href={`/people/${person.id}`}
                className="bg-card hover:bg-accent/40 flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{person.name}</p>
                    {person.types.map((type) => (
                      <PersonTypeChip key={type} type={type} />
                    ))}
                  </div>

                  <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
                    <Phone className="size-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{person.phone}</span>
                  </div>

                  {person.email ? (
                    <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-sm">
                      <Mail className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{person.email}</span>
                    </div>
                  ) : null}

                  <p className="text-muted-foreground/80 mt-1.5 text-xs">
                    Customer since {formatDate(person.createdAt, brand.timezone)}
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
