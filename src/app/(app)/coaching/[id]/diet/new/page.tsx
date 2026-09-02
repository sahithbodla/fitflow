import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DietPlanForm } from "@/components/diet/diet-plan-form";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getCoachingClient } from "@/lib/coaching/queries";
import { todayInputValue } from "@/lib/memberships/dates";

export const metadata: Metadata = { title: "New diet plan" };

export default async function NewDietPlanPage({
  params,
}: PageProps<"/coaching/[id]/diet/new">) {
  const { id } = await params;
  await requireUser(`/coaching/${id}/diet/new`);

  const [client, brand] = await Promise.all([
    getCoachingClient(id),
    getBrandSettings(),
  ]);
  if (!client) notFound();

  return (
    <div className="space-y-5">
      <Link
        href={`/coaching/${client.id}?tab=diet`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        {client.personName}
      </Link>

      <PageHeader
        title="New diet plan"
        description="Name it first — you'll add meals next."
      />

      <DietPlanForm
        planId={null}
        coachingClientId={client.id}
        clientName={client.personName}
        submitLabel="Create plan"
        cancelHref={`/coaching/${client.id}?tab=diet`}
        defaults={{
          title: "",
          goal: "",
          notes: "",
          calorieTarget: "",
          proteinTarget: "",
          carbTarget: "",
          fatTarget: "",
          startDate: todayInputValue(brand.timezone),
        }}
      />
    </div>
  );
}
