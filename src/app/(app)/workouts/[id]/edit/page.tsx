import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { WorkoutDetailsForm } from "@/components/workouts/workout-details-form";
import { requireUser } from "@/lib/auth/guard";
import { getWorkoutTemplate } from "@/lib/workouts/queries";
import { saveWorkoutTemplateAction } from "@/lib/actions/workouts";

export const metadata: Metadata = { title: "Edit template" };

export default async function EditWorkoutTemplatePage({
  params,
}: PageProps<"/workouts/[id]/edit">) {
  const { id } = await params;
  await requireUser(`/workouts/${id}/edit`);

  const template = await getWorkoutTemplate(id);
  if (!template) notFound();

  return (
    <div className="space-y-5">
      <Link
        href={`/workouts/${template.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        {template.name}
      </Link>

      <PageHeader title="Edit template details" />

      <WorkoutDetailsForm
        action={saveWorkoutTemplateAction.bind(null, template.id)}
        submitLabel="Save changes"
        cancelHref={`/workouts/${template.id}`}
        description="Days and exercises are edited on the template page."
        defaults={{
          name: template.name,
          description: template.description,
          goal: template.goal,
        }}
      />
    </div>
  );
}
