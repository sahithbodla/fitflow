import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, FileText, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getCoachingClient } from "@/lib/coaching/queries";
import {
  getClientWorkoutPlan,
  listActiveExercises,
} from "@/lib/workouts/queries";
import { formatDate } from "@/lib/dates";
import { WORKOUT_GOAL_LABELS } from "@/lib/workouts/constants";
import { PlanBuilder } from "../plan-builder";
import { TogglePlanButton } from "./toggle-plan";

export async function generateMetadata({
  params,
}: PageProps<"/coaching/[id]/workouts/[planId]">): Promise<Metadata> {
  const { planId } = await params;
  const plan = await getClientWorkoutPlan(planId);
  return { title: plan ? plan.name : "Workout plan" };
}

export default async function ClientWorkoutPlanPage({
  params,
}: PageProps<"/coaching/[id]/workouts/[planId]">) {
  const { id, planId } = await params;
  await requireUser(`/coaching/${id}/workouts/${planId}`);

  const [client, plan, library, brand] = await Promise.all([
    getCoachingClient(id),
    getClientWorkoutPlan(planId),
    listActiveExercises(),
    getBrandSettings(),
  ]);
  if (!client || !plan || plan.coachingClientId !== client.id) notFound();

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
        title={plan.name}
        description={plan.description || undefined}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/coaching/${client.id}/workouts/${plan.id}/edit`}>
                <Pencil className="size-4" />
                Edit details
              </Link>
            </Button>
            <TogglePlanButton
              planId={plan.id}
              clientId={client.id}
              active={plan.active}
            />
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {plan.active ? (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            Active
          </span>
        ) : (
          <Badge variant="secondary" className="text-[10px]">
            Archived
          </Badge>
        )}

        {plan.goal ? (
          <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs">
            {WORKOUT_GOAL_LABELS[plan.goal]}
          </span>
        ) : null}

        <span className="text-muted-foreground text-sm">
          From {formatDate(plan.startDate, brand.timezone)} ·{" "}
          {plan.dayCount} {plan.dayCount === 1 ? "day" : "days"} ·{" "}
          {plan.exerciseCount}{" "}
          {plan.exerciseCount === 1 ? "exercise" : "exercises"}
        </span>
      </div>

      {plan.sourceTemplateName ? (
        <div className="bg-muted/40 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5 text-sm">
          <FileText className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <span>
            Copied from{" "}
            {plan.sourceTemplateId ? (
              <Link
                href={`/workouts/${plan.sourceTemplateId}`}
                className="text-brand hover:underline"
              >
                {plan.sourceTemplateName}
              </Link>
            ) : (
              plan.sourceTemplateName
            )}
          </span>
          {plan.customised ? (
            <Badge variant="secondary" className="text-[10px]">
              Customised
            </Badge>
          ) : null}
        </div>
      ) : null}

      <PlanBuilder
        planId={plan.id}
        clientId={client.id}
        days={plan.days}
        library={library}
        readOnlyNotice={
          plan.sourceTemplateName
            ? "Changes here affect this client only — the template is untouched."
            : undefined
        }
      />
    </div>
  );
}
