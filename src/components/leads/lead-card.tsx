import Link from "next/link";
import { ChevronRight, Mail, Phone } from "lucide-react";
import {
  FollowUpBadge,
  LeadInterestChip,
  LeadStatusBadge,
} from "@/components/leads/lead-badges";
import type { LeadListItem } from "@/lib/leads/queries";

/**
 * Mobile presentation of a lead. Cards rather than table rows, so nothing is
 * truncated off-screen and the whole row is a comfortable tap target.
 */
export function LeadCard({
  lead,
  timeZone,
}: {
  lead: LeadListItem;
  timeZone: string;
}) {
  return (
    <Link
      href={`/leads/${lead.id}`}
      className="bg-card hover:bg-accent/40 flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{lead.name}</p>
          <LeadStatusBadge status={lead.status} />
        </div>

        <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
          <Phone className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{lead.phone}</span>
        </div>

        {lead.email ? (
          <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-sm">
            <Mail className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{lead.email}</span>
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <LeadInterestChip interest={lead.interestedIn} />
          <FollowUpBadge date={lead.followUpDate} timeZone={timeZone} />
        </div>
      </div>

      <ChevronRight
        className="text-muted-foreground size-4 shrink-0"
        aria-hidden
      />
    </Link>
  );
}
