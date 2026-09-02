import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import { getExercise } from "@/lib/workouts/queries";
import { ExerciseForm } from "../../exercise-form";

export const metadata: Metadata = { title: "Edit exercise" };

export default async function EditExercisePage({
  params,
}: PageProps<"/exercises/[id]/edit">) {
  const { id } = await params;
  await requireUser(`/exercises/${id}/edit`);

  const exercise = await getExercise(id);
  if (!exercise) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/exercises"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Exercise library
      </Link>

      <PageHeader
        title="Edit exercise"
        description="Existing workouts keep the name they were built with."
      />

      <ExerciseForm
        exerciseId={exercise.id}
        defaults={{
          name: exercise.name,
          category: exercise.category,
          instructions: exercise.instructions,
          externalVideoUrl: exercise.externalVideoUrl,
          active: exercise.active,
        }}
      />
    </div>
  );
}
