import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, ClipboardList, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { listAuditLogs } from "@/lib/audit/queries";
import { auditLogFilterSchema } from "@/lib/validation/audit";
import { AUDIT_ACTION_LABELS } from "@/lib/audit/summarize";
import { summarizeAuditEntry } from "@/lib/audit/summarize";
import { formatDateTime } from "@/lib/dates";
import { AuditLogFilters } from "./audit-log-filters";

export const metadata: Metadata = { title: "Audit log" };

export default async function AuditLogPage({
  searchParams,
}: PageProps<"/settings/audit-logs">) {
  await requireUser("/settings/audit-logs");
  const brand = await getBrandSettings();
  const params = await searchParams;

  const parsed = auditLogFilterSchema.safeParse(params);
  const filters = parsed.success ? parsed.data : auditLogFilterSchema.parse({});

  const { entries, total, page, pageCount } = await listAuditLogs(filters, brand.timezone);

  const buildPageHref = (target: number) => {
    const next = new URLSearchParams();
    if (filters.action) next.set("action", filters.action);
    if (filters.entityType) next.set("entityType", filters.entityType);
    if (filters.date) next.set("date", filters.date);
    if (target > 1) next.set("page", String(target));
    const query = next.toString();
    return query ? `/settings/audit-logs?${query}` : "/settings/audit-logs";
  };

  const isFiltered = Boolean(filters.action || filters.entityType || filters.date);

  return (
    <div className="space-y-5">
      <Link
        href="/settings"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ChevronLeft className="size-4" />
        Business settings
      </Link>

      <PageHeader
        title="Audit log"
        description={total > 0 ? `${total} recorded ${total === 1 ? "event" : "events"}` : "A record of who did what."}
      />

      <AuditLogFilters />

      {entries.length === 0 ? (
        <EmptyState
          icon={isFiltered ? ScrollText : ClipboardList}
          title={isFiltered ? "No events match those filters" : "Nothing recorded yet"}
          description={
            isFiltered
              ? "Try a different action, entity type, or date."
              : "Payments, memberships, leads and coaching actions will appear here as they happen."
          }
          action={
            isFiltered ? (
              <Button asChild variant="outline">
                <Link href="/settings/audit-logs">Clear filters</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ul className="divide-y rounded-xl border">
            {entries.map((entry) => {
              const { subject, detail } = summarizeAuditEntry(entry);
              return (
                <li key={entry.id} className="px-4 py-3.5">
                  <p className="text-sm font-medium">{AUDIT_ACTION_LABELS[entry.action]}</p>
                  <p className="mt-0.5 truncate text-sm">{subject}</p>
                  {detail ? (
                    <p className="text-muted-foreground mt-0.5 truncate text-xs">{detail}</p>
                  ) : null}
                  <p className="text-muted-foreground/80 mt-1.5 text-xs">
                    By {entry.actorName} · {formatDateTime(entry.createdAt, brand.timezone)}
                  </p>
                </li>
              );
            })}
          </ul>

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
