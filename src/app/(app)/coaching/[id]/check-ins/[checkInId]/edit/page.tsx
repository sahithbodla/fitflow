import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CheckInForm } from "@/components/checkins/checkin-form";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getCoachingClient } from "@/lib/coaching/queries";
import { getCheckIn } from "@/lib/checkins/queries";
import { toDateInputValue } from "@/lib/memberships/dates";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Edit check-in" };

export default async function EditCheckInPage({
  params,
}: PageProps<"/coaching/[id]/check-ins/[checkInId]/edit">) {
  const { id, checkInId } = await params;
  await requireUser(`/coaching/${id}/check-ins/${checkInId}/edit`);

  const [client, checkIn, brand] = await Promise.all([
    getCoachingClient(id),
    getCheckIn(checkInId),
    getBrandSettings(),
  ]);
  if (!client || !checkIn || checkIn.coachingClientId !== client.id) notFound();

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
        title="Edit check-in"
        description={formatDate(checkIn.checkInDate, brand.timezone)}
      />

      <CheckInForm
        checkInId={checkIn.id}
        coachingClientId={client.id}
        submitLabel="Save changes"
        cancelHref={`/coaching/${client.id}?tab=check-ins`}
        defaults={{
          checkInDate: toDateInputValue(checkIn.checkInDate, brand.timezone),
          weight: checkIn.weight !== null ? String(checkIn.weight) : "",
          weightUnit: checkIn.weightUnit,
          dietAdherence: checkIn.dietAdherence,
          workoutAdherence: checkIn.workoutAdherence,
          questions: checkIn.questions,
          coachNotes: checkIn.coachNotes,
        }}
      />
    </div>
  );
}
