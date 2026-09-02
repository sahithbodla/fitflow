import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import { getBrandSettings } from "@/lib/settings";
import { getCoachingClient } from "@/lib/coaching/queries";
import { getDietPlan } from "@/lib/diet/queries";
import { formatDate } from "@/lib/dates";
import { DIET_GOAL_LABELS } from "@/lib/diet/constants";
import { ClientDietEditor } from "../diet-editor-wrapper";
import { ToggleDietPlanButton } from "./toggle-diet-plan";

export async function generateMetadata({
  params,
}: PageProps<"/coaching/[id]/diet/[planId]">): Promise<Metadata> {
  const { planId } = await params;
  const plan = await getDietPlan(planId);
  return { title: plan ? plan.title : "Diet plan" };
}

export default async function DietPlanPage({
  params,
}: PageProps<"/coaching/[id]/diet/[planId]">) {
  const { id, planId } = await params;
  await requireUser(`/coaching/${id}/diet/${planId}`);

  const [client, plan, brand] = await Promise.all([
    getCoachingClient(id),
    getDietPlan(planId),
    getBrandSettings(),
  ]);
  if (!client || !plan || plan.coachingClientId !== client.id) notFound();

  const targets = [
    { label: "Calories", value: plan.calorieTarget, unit: "" },
    { label: "Protein", value: plan.proteinTarget, unit: "g" },
    { label: "Carbs", value: plan.carbTarget, unit: "g" },
    { label: "Fat", value: plan.fatTarget, unit: "g" },
  ].filter((target) => target.value !== null);

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
        title={plan.title}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/coaching/${client.id}/diet/${plan.id}/edit`}>
                <Pencil className="size-4" />
                Edit details
              </Link>
            </Button>
            <ToggleDietPlanButton
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
            Current plan
          </span>
        ) : (
          <Badge variant="secondary" className="text-[10px]">
            Past plan
          </Badge>
        )}
        {plan.goal ? (
          <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs">
            {DIET_GOAL_LABELS[plan.goal]}
          </span>
        ) : null}
        <span className="text-muted-foreground text-sm">
          From {formatDate(plan.startDate, brand.timezone)} · {plan.mealCount}{" "}
          {plan.mealCount === 1 ? "meal" : "meals"} · {plan.itemCount}{" "}
          {plan.itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      {targets.length > 0 ? (
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {targets.map((target) => (
                <div key={target.label}>
                  <p className="text-muted-foreground text-xs">
                    {target.label}
                  </p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums">
                    {target.value}
                    {target.unit}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground/80 mt-3 text-xs text-pretty">
              Targets you entered. FitFlow does not calculate nutrition or check
              these against the meals below.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {plan.notes ? (
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs">Notes</p>
            <p className="mt-1 text-sm whitespace-pre-wrap">{plan.notes}</p>
          </CardContent>
        </Card>
      ) : null}

      <ClientDietEditor plan={plan} clientId={client.id} />
    </div>
  );
}
