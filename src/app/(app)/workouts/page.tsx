import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, Dumbbell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { requireUser } from "@/lib/auth/guard";
import { listWorkoutTemplates } from "@/lib/workouts/queries";
import { WORKOUT_GOAL_LABELS } from "@/lib/workouts/constants";
import { ToggleTemplateButton } from "./toggle-template";

export const metadata: Metadata = { title: "Workout templates" };

export default async function WorkoutsPage() {
  await requireUser("/workouts");
  const templates = await listWorkoutTemplates();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Workout templates"
        description="Reusable programmes you can assign to coaching clients."
        actions={
          <Button
            asChild
            className="bg-brand text-brand-foreground hover:bg-brand-strong"
          >
            <Link href="/workouts/new">
              <Plus className="size-4" />
              New template
            </Link>
          </Button>
        }
      />

      {templates.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No templates yet"
          description="Build a programme once, then assign it to as many clients as you like. Each client gets their own copy to customise."
          action={
            <Button
              asChild
              className="bg-brand text-brand-foreground hover:bg-brand-strong"
            >
              <Link href="/workouts/new">
                <Plus className="size-4" />
                Create your first template
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-card rounded-xl border px-4 py-3.5"
            >
              <Link
                href={`/workouts/${template.id}`}
                className="group flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="group-hover:text-brand truncate font-medium transition-colors">
                      {template.name}
                    </p>
                    {template.goal ? (
                      <span className="bg-muted text-muted-foreground inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs">
                        {WORKOUT_GOAL_LABELS[template.goal]}
                      </span>
                    ) : null}
                    {!template.active ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Inactive
                      </Badge>
                    ) : null}
                  </div>

                  {template.description ? (
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm text-pretty">
                      {template.description}
                    </p>
                  ) : null}

                  <p className="text-muted-foreground/80 mt-1 text-xs">
                    {template.dayCount}{" "}
                    {template.dayCount === 1 ? "day" : "days"} ·{" "}
                    {template.exerciseCount}{" "}
                    {template.exerciseCount === 1 ? "exercise" : "exercises"}
                  </p>
                </div>

                <ChevronRight
                  className="text-muted-foreground size-4 shrink-0"
                  aria-hidden
                />
              </Link>

              <div className="mt-1 flex justify-end">
                <ToggleTemplateButton
                  templateId={template.id}
                  templateName={template.name}
                  active={template.active}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
