import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { DietPlanForm } from "@/components/diet/diet-plan-form";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getCoachingClient } from "@/lib/coaching/queries";
import { getDietPlan } from "@/lib/diet/queries";
import { toDateInputValue } from "@/lib/memberships/dates";

export const metadata: Metadata = { title: "Edit diet plan" };

export default async function EditDietPlanPage({
  params,
}: PageProps<"/coaching/[id]/diet/[planId]/edit">) {
  const { id, planId } = await params;
  await requireUser(`/coaching/${id}/diet/${planId}/edit`);

  const [client, plan, brand] = await Promise.all([
    getCoachingClient(id),
    getDietPlan(planId),
    getBrandSettings(),
  ]);
  if (!client || !plan || plan.coachingClientId !== client.id) notFound();

  return (
    <div className="space-y-5">
      <Link
        href={`/coaching/${client.id}/diet/${plan.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        {plan.title}
      </Link>

      <PageHeader
        title="Edit diet plan"
        description="Meals and foods are edited on the plan page."
      />

      <DietPlanForm
        planId={plan.id}
        coachingClientId={client.id}
        clientName={client.personName}
        submitLabel="Save changes"
        cancelHref={`/coaching/${client.id}/diet/${plan.id}`}
        defaults={{
          title: plan.title,
          goal: plan.goal,
          notes: plan.notes,
          calorieTarget:
            plan.calorieTarget !== null ? String(plan.calorieTarget) : "",
          proteinTarget:
            plan.proteinTarget !== null ? String(plan.proteinTarget) : "",
          carbTarget: plan.carbTarget !== null ? String(plan.carbTarget) : "",
          fatTarget: plan.fatTarget !== null ? String(plan.fatTarget) : "",
          startDate: toDateInputValue(plan.startDate, brand.timezone),
        }}
      />
    </div>
  );
}
