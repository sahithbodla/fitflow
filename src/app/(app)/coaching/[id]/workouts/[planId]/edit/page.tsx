import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import { getClientWorkoutPlan } from "@/lib/workouts/queries";
import { EditPlanDetailsForm } from "./edit-plan-form";

export const metadata: Metadata = { title: "Edit plan" };

export default async function EditClientPlanPage({
  params,
}: PageProps<"/coaching/[id]/workouts/[planId]/edit">) {
  const { id, planId } = await params;
  await requireUser(`/coaching/${id}/workouts/${planId}/edit`);

  const plan = await getClientWorkoutPlan(planId);
  if (!plan || plan.coachingClientId !== id) notFound();

  return (
    <div className="space-y-5">
      <Link
        href={`/coaching/${id}/workouts/${plan.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        {plan.name}
      </Link>

      <PageHeader title="Edit plan details" />

      <EditPlanDetailsForm
        planId={plan.id}
        clientId={id}
        defaults={{
          name: plan.name,
          description: plan.description,
          goal: plan.goal,
        }}
      />
    </div>
  );
}
