import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getLead } from "@/lib/leads/queries";
import { zonedParts } from "@/lib/dates";
import { EditLeadForm } from "./edit-lead-form";

export const metadata: Metadata = { title: "Edit lead" };

/** Formats an instant as the `yyyy-mm-dd` a date input expects. */
function toDateInputValue(iso: string | null, timeZone: string): string {
  if (!iso) return "";
  const { year, month, day } = zonedParts(new Date(iso), timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default async function EditLeadPage({
  params,
}: PageProps<"/leads/[id]/edit">) {
  const { id } = await params;
  await requireUser(`/leads/${id}/edit`);

  const brand = await getBrandSettings();
  const lead = await getLead(id);
  if (!lead) notFound();

  return (
    <div className="space-y-5">
      <Link
        href={`/leads/${lead.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        {lead.name}
      </Link>

      <PageHeader title="Edit lead" />

      <EditLeadForm
        leadId={lead.id}
        defaults={{
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          instagramHandle: lead.instagramHandle,
          fitnessGoal: lead.fitnessGoal,
          interestedIn: lead.interestedIn,
          source: lead.source,
          status: lead.status,
          followUpDate: toDateInputValue(lead.followUpDate, brand.timezone),
        }}
      />
    </div>
  );
}
