import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FollowUpBadge,
  LeadStatusBadge,
} from "@/components/leads/lead-badges";
import { formatDate } from "@/lib/dates";
import {
  LEAD_INTEREST_LABELS,
  LEAD_SOURCE_LABELS,
} from "@/lib/leads/constants";
import type { LeadListItem } from "@/lib/leads/queries";

/** Desktop-only view. Below `md` the list renders as cards instead. */
export function LeadsTable({
  leads,
  timeZone,
}: {
  leads: LeadListItem[];
  timeZone: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Interest</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Follow-up</TableHead>
            <TableHead>Added</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className="group">
              <TableCell className="font-medium">
                <Link
                  href={`/leads/${lead.id}`}
                  className="hover:text-brand after:absolute after:inset-0 relative transition-colors"
                >
                  {lead.name}
                </Link>
                <span className="text-muted-foreground block text-xs">
                  {LEAD_SOURCE_LABELS[lead.source]}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                <span className="block">{lead.phone}</span>
                {lead.email ? (
                  <span className="block truncate text-xs">{lead.email}</span>
                ) : null}
              </TableCell>
              <TableCell className="text-sm">
                {LEAD_INTEREST_LABELS[lead.interestedIn]}
              </TableCell>
              <TableCell>
                <LeadStatusBadge status={lead.status} />
              </TableCell>
              <TableCell>
                {lead.followUpDate ? (
                  <FollowUpBadge
                    date={lead.followUpDate}
                    timeZone={timeZone}
                  />
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                {formatDate(lead.createdAt, timeZone)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
