import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/guard";
import { ExerciseForm } from "../exercise-form";

export const metadata: Metadata = { title: "Add exercise" };

export default async function NewExercisePage() {
  await requireUser("/exercises/new");

  return (
    <div className="space-y-5">
      <Link
        href="/exercises"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Exercise library
      </Link>

      <PageHeader title="Add exercise" />

      <ExerciseForm
        exerciseId={null}
        defaults={{
          name: "",
          category: "",
          instructions: "",
          externalVideoUrl: "",
          active: true,
        }}
      />
    </div>
  );
}
