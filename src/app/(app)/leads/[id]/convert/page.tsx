import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import { getLead, getLeadConversions } from "@/lib/leads/queries";
import { findMatchingPerson } from "@/lib/people/queries";
import {
  INTEREST_TO_CONVERSION,
  type ConversionType,
} from "@/lib/people/constants";
import { ConvertForm } from "./convert-form";

export const metadata: Metadata = { title: "Convert lead" };

export default async function ConvertLeadPage({
  params,
}: PageProps<"/leads/[id]/convert">) {
  const { id } = await params;
  await requireUser(`/leads/${id}/convert`);

  const lead = await getLead(id);
  if (!lead) notFound();

  const conversions = await getLeadConversions(lead.id);
  const alreadyConverted = conversions.map((row) => row.type as ConversionType);

  // Nothing left to convert to — send them to the customer instead of showing
  // a form with every option disabled.
  if (alreadyConverted.length >= 3) {
    redirect(`/people/${conversions[0].personId}`);
  }

  const match = await findMatchingPerson(lead.phone, lead.email);

  const suggested =
    INTEREST_TO_CONVERSION[lead.interestedIn] ?? "gym_member";
  const firstAvailable =
    (["gym_member", "pt_client", "online_coaching"] as ConversionType[]).find(
      (type) => !alreadyConverted.includes(type),
    ) ?? "gym_member";

  return (
    <div className="space-y-5">
      <Link
        href={`/leads/${lead.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        {lead.name}
      </Link>

      <PageHeader
        title="Convert lead"
        description={`Turn ${lead.name} into a customer.`}
      />

      <ConvertForm
        leadId={lead.id}
        leadName={lead.name}
        suggested={
          alreadyConverted.includes(suggested) ? firstAvailable : suggested
        }
        alreadyConverted={alreadyConverted}
        match={match}
      />
    </div>
  );
}
