import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getCoachingClient } from "@/lib/coaching/queries";
import { toDateInputValue } from "@/lib/memberships/dates";
import { EditCoachingForm } from "./edit-coaching-form";

export const metadata: Metadata = { title: "Edit coaching client" };

export default async function EditCoachingClientPage({
  params,
}: PageProps<"/coaching/[id]/edit">) {
  const { id } = await params;
  await requireUser(`/coaching/${id}/edit`);

  const brand = await getBrandSettings();
  const client = await getCoachingClient(id);
  if (!client) notFound();

  return (
    <div className="space-y-5">
      <Link
        href={`/coaching/${client.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        {client.personName}
      </Link>

      <PageHeader title="Edit coaching client" />

      <EditCoachingForm
        clientId={client.id}
        personId={client.personId}
        personName={client.personName}
        defaults={{
          status: client.status,
          startDate: toDateInputValue(client.startDate, brand.timezone),
          endDate: toDateInputValue(client.endDate, brand.timezone),
          goal: client.goal,
          notes: client.notes,
        }}
      />
    </div>
  );
}
