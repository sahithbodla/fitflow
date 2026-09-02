import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getCoachingClient } from "@/lib/coaching/queries";
import { listWorkoutTemplates } from "@/lib/workouts/queries";
import { todayInputValue } from "@/lib/memberships/dates";
import { AssignWorkoutForm } from "./assign-form";

export const metadata: Metadata = { title: "New workout plan" };

export default async function NewClientWorkoutPage({
  params,
}: PageProps<"/coaching/[id]/workouts/new">) {
  const { id } = await params;
  await requireUser(`/coaching/${id}/workouts/new`);

  const [client, brand, templates] = await Promise.all([
    getCoachingClient(id),
    getBrandSettings(),
    listWorkoutTemplates(),
  ]);
  if (!client) notFound();

  return (
    <div className="space-y-5">
      <Link
        href={`/coaching/${client.id}?tab=workouts`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        {client.personName}
      </Link>

      <PageHeader
        title="New workout plan"
        description={`For ${client.personName}.`}
      />

      <AssignWorkoutForm
        coachingClientId={client.id}
        clientName={client.personName}
        templates={templates.filter((template) => template.active)}
        today={todayInputValue(brand.timezone)}
      />
    </div>
  );
}
