import Link from "next/link";
import type { Metadata } from "next";
import { Dumbbell, Pencil, Play, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { requireUser } from "@/lib/auth/guard";
import {
  getExerciseCategoryCounts,
  listExercises,
} from "@/lib/workouts/queries";
import { exerciseFilterSchema } from "@/lib/validation/workout";
import { EXERCISE_CATEGORY_LABELS } from "@/lib/workouts/constants";
import { ExerciseSearch } from "./exercise-search";
import { ToggleExerciseButton } from "./toggle-exercise";

export const metadata: Metadata = { title: "Exercise library" };

export default async function ExercisesPage({
  searchParams,
}: PageProps<"/exercises">) {
  await requireUser("/exercises");
  const params = await searchParams;

  const parsed = exerciseFilterSchema.safeParse(params);
  const filters = parsed.success
    ? parsed.data
    : exerciseFilterSchema.parse({});

  const [{ exercises, total, page, pageCount }, counts] = await Promise.all([
    listExercises(filters),
    getExerciseCategoryCounts(),
  ]);

  const hasAny = (counts.all ?? 0) > 0;
  const isFiltered = Boolean(filters.q || filters.category);

  const buildPageHref = (target: number) => {
    const next = new URLSearchParams();
    if (filters.q) next.set("q", filters.q);
    if (filters.category) next.set("category", filters.category);
    if (target > 1) next.set("page", String(target));
    const query = next.toString();
    return query ? `/exercises?${query}` : "/exercises";
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Exercise library"
        description={
          hasAny
            ? `${total} ${total === 1 ? "exercise" : "exercises"}`
            : "The movements you build workouts from."
        }
        actions={
          <Button
            asChild
            className="bg-brand text-brand-foreground hover:bg-brand-strong"
          >
            <Link href="/exercises/new">
              <Plus className="size-4" />
              Add exercise
            </Link>
          </Button>
        }
      />

      {hasAny ? <ExerciseSearch counts={counts} /> : null}

      {exercises.length === 0 ? (
        isFiltered ? (
          <EmptyState
            icon={Search}
            title="No exercises match"
            description="Try a different category, or clear the search."
            action={
              <Button asChild variant="outline">
                <Link href="/exercises">Clear filters</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Dumbbell}
            title="No exercises yet"
            description="Add the movements you program with. You can link a video for each one."
            action={
              <Button
                asChild
                className="bg-brand text-brand-foreground hover:bg-brand-strong"
              >
                <Link href="/exercises/new">
                  <Plus className="size-4" />
                  Add your first exercise
                </Link>
              </Button>
            }
          />
        )
      ) : (
        <>
          <div className="space-y-2.5">
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="bg-card rounded-xl border px-4 py-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{exercise.name}</p>
                      {exercise.category ? (
                        <span className="bg-muted text-muted-foreground inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs">
                          {EXERCISE_CATEGORY_LABELS[exercise.category]}
                        </span>
                      ) : null}
                      {!exercise.active ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Inactive
                        </Badge>
                      ) : null}
                    </div>

                    {exercise.instructions ? (
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-sm text-pretty">
                        {exercise.instructions}
                      </p>
                    ) : null}

                    {exercise.externalVideoUrl ? (
                      <a
                        href={exercise.externalVideoUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-brand mt-1.5 inline-flex items-center gap-1 text-xs hover:underline"
                      >
                        <Play className="size-3" aria-hidden />
                        Watch video
                      </a>
                    ) : null}
                  </div>

                  <Button asChild variant="ghost" size="sm" className="shrink-0">
                    <Link href={`/exercises/${exercise.id}/edit`}>
                      <Pencil className="size-4" />
                      <span className="sr-only">Edit {exercise.name}</span>
                    </Link>
                  </Button>
                </div>

                <div className="mt-1 flex justify-end">
                  <ToggleExerciseButton
                    exerciseId={exercise.id}
                    exerciseName={exercise.name}
                    active={exercise.active}
                  />
                </div>
              </div>
            ))}
          </div>

          {pageCount > 1 ? (
            <nav
              className="flex items-center justify-between gap-3 pt-1"
              aria-label="Pagination"
            >
              <Button asChild={page > 1} variant="outline" size="sm" disabled={page <= 1}>
                {page > 1 ? (
                  <Link href={buildPageHref(page - 1)}>Previous</Link>
                ) : (
                  <span>Previous</span>
                )}
              </Button>
              <span className="text-muted-foreground text-sm">
                Page {page} of {pageCount}
              </span>
              <Button
                asChild={page < pageCount}
                variant="outline"
                size="sm"
                disabled={page >= pageCount}
              >
                {page < pageCount ? (
                  <Link href={buildPageHref(page + 1)}>Next</Link>
                ) : (
                  <span>Next</span>
                )}
              </Button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
