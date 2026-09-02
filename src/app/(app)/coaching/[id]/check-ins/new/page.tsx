import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CheckInForm } from "@/components/checkins/checkin-form";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getCoachingClient } from "@/lib/coaching/queries";
import { todayInputValue } from "@/lib/memberships/dates";

export const metadata: Metadata = { title: "New check-in" };

export default async function NewCheckInPage({
  params,
}: PageProps<"/coaching/[id]/check-ins/new">) {
  const { id } = await params;
  await requireUser(`/coaching/${id}/check-ins/new`);

  const [client, brand] = await Promise.all([
    getCoachingClient(id),
    getBrandSettings(),
  ]);
  if (!client) notFound();

  return (
    <div className="space-y-5">
      <Link
        href={`/coaching/${client.id}?tab=check-ins`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        {client.personName}
      </Link>

      <PageHeader
        title="New check-in"
        description={`Record what ${client.personName} sent you this week.`}
      />

      <CheckInForm
        checkInId={null}
        coachingClientId={client.id}
        submitLabel="Save check-in"
        cancelHref={`/coaching/${client.id}?tab=check-ins`}
        defaults={{
          checkInDate: todayInputValue(brand.timezone),
          weight: "",
          weightUnit: "kg",
          dietAdherence: "",
          workoutAdherence: "",
          questions: "",
          coachNotes: "",
        }}
      />
    </div>
  );
}
