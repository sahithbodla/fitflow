import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { WorkoutDetailsForm } from "@/components/workouts/workout-details-form";
import { requireUser } from "@/lib/auth/guard";
import { saveWorkoutTemplateAction } from "@/lib/actions/workouts";

export const metadata: Metadata = { title: "New template" };

export default async function NewWorkoutTemplatePage() {
  await requireUser("/workouts/new");

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
        title="New template"
        description="Name it first — you'll add days and exercises next."
      />

      <WorkoutDetailsForm
        action={saveWorkoutTemplateAction.bind(null, null)}
        submitLabel="Create template"
        cancelHref="/workouts"
        defaults={{ name: "", description: "", goal: "" }}
      />
    </div>
  );
}
