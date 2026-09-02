import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import {
  getWorkoutTemplate,
  listActiveExercises,
} from "@/lib/workouts/queries";
import { WORKOUT_GOAL_LABELS } from "@/lib/workouts/constants";
import { TemplateBuilder } from "../template-builder";

export async function generateMetadata({
  params,
}: PageProps<"/workouts/[id]">): Promise<Metadata> {
  const { id } = await params;
  const template = await getWorkoutTemplate(id);
  return { title: template ? template.name : "Template" };
}

export default async function WorkoutTemplatePage({
  params,
}: PageProps<"/workouts/[id]">) {
  const { id } = await params;
  await requireUser(`/workouts/${id}`);

  const [template, library] = await Promise.all([
    getWorkoutTemplate(id),
    listActiveExercises(),
  ]);
  if (!template) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/workouts"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Workout templates
      </Link>

      <PageHeader
        title={template.name}
        description={template.description || undefined}
        actions={
          <Button asChild variant="outline">
            <Link href={`/workouts/${template.id}/edit`}>
              <Pencil className="size-4" />
              Edit details
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {template.goal ? (
          <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs">
            {WORKOUT_GOAL_LABELS[template.goal]}
          </span>
        ) : null}
        {!template.active ? (
          <Badge variant="secondary" className="text-[10px]">
            Inactive
          </Badge>
        ) : null}
        <span className="text-muted-foreground text-sm">
          {template.dayCount} {template.dayCount === 1 ? "day" : "days"} ·{" "}
          {template.exerciseCount}{" "}
          {template.exerciseCount === 1 ? "exercise" : "exercises"}
        </span>
      </div>

      <p className="text-muted-foreground text-sm text-pretty">
        Assigning this template gives each client their own copy. Editing their
        copy never changes this template.
      </p>

      <TemplateBuilder
        templateId={template.id}
        days={template.days}
        library={library}
      />
    </div>
  );
}
