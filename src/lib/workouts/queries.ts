import "server-only";
import type { QueryFilter } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Exercise, type ExerciseDoc } from "@/models/Exercise";
import {
  WorkoutTemplate,
  type WorkoutTemplateDoc,
} from "@/models/WorkoutTemplate";
import {
  ClientWorkoutPlan,
  type ClientWorkoutPlanDoc,
} from "@/models/ClientWorkoutPlan";
import type {
  ExerciseCategory,
  WorkoutGoal,
} from "@/lib/workouts/constants";

export const EXERCISES_PAGE_SIZE = 30;

export type ExerciseItem = {
  id: string;
  name: string;
  category: ExerciseCategory | "";
  instructions: string;
  externalVideoUrl: string;
  active: boolean;
};

export type WorkoutExerciseItem = {
  id: string;
  exerciseId: string | null;
  exerciseName: string;
  videoUrl: string;
  sets: string;
  reps: string;
  rest: string;
  notes: string;
};

export type WorkoutDayItem = {
  id: string;
  name: string;
  notes: string;
  exercises: WorkoutExerciseItem[];
};

export type WorkoutTemplateItem = {
  id: string;
  name: string;
  description: string;
  goal: WorkoutGoal | "";
  active: boolean;
  days: WorkoutDayItem[];
  dayCount: number;
  exerciseCount: number;
};

export type ClientWorkoutPlanItem = WorkoutTemplateItem & {
  coachingClientId: string;
  sourceTemplateId: string | null;
  sourceTemplateName: string;
  customised: boolean;
  startDate: string;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type RawDay = {
  _id: unknown;
  name: string;
  notes?: string;
  order: number;
  exercises: {
    _id: unknown;
    exercise?: unknown;
    exerciseName: string;
    videoUrl?: string;
    sets?: string;
    reps?: string;
    rest?: string;
    notes?: string;
    order: number;
  }[];
};

function toDays(days: RawDay[] | undefined): WorkoutDayItem[] {
  return [...(days ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((day) => ({
      id: String(day._id),
      name: day.name,
      notes: day.notes ?? "",
      exercises: [...(day.exercises ?? [])]
        .sort((a, b) => a.order - b.order)
        .map((entry) => ({
          id: String(entry._id),
          exerciseId: entry.exercise ? String(entry.exercise) : null,
          exerciseName: entry.exerciseName,
          videoUrl: entry.videoUrl ?? "",
          sets: entry.sets ?? "",
          reps: entry.reps ?? "",
          rest: entry.rest ?? "",
          notes: entry.notes ?? "",
        })),
    }));
}

function countExercises(days: WorkoutDayItem[]): number {
  return days.reduce((sum, day) => sum + day.exercises.length, 0);
}

// ---------------------------------------------------------------------------
// Exercises
// ---------------------------------------------------------------------------

export async function listExercises(filters: {
  q?: string;
  category?: ExerciseCategory;
  page: number;
}): Promise<{
  exercises: ExerciseItem[];
  total: number;
  page: number;
  pageCount: number;
}> {
  await connectToDatabase();

  const query: QueryFilter<ExerciseDoc> = { archivedAt: null };
  if (filters.category) query.category = filters.category;
  if (filters.q) {
    query.name = new RegExp(escapeRegex(filters.q), "i");
  }

  const page = Math.max(1, filters.page);

  const [docs, total] = await Promise.all([
    Exercise.find(query)
      .sort({ active: -1, name: 1 })
      .skip((page - 1) * EXERCISES_PAGE_SIZE)
      .limit(EXERCISES_PAGE_SIZE)
      .lean<ExerciseDoc[]>(),
    Exercise.countDocuments(query),
  ]);

  return {
    exercises: docs.map((doc) => ({
      id: String(doc._id),
      name: doc.name,
      category: (doc.category ?? "") as ExerciseCategory | "",
      instructions: doc.instructions ?? "",
      externalVideoUrl: doc.externalVideoUrl ?? "",
      active: doc.active,
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / EXERCISES_PAGE_SIZE)),
  };
}

export async function getExercise(id: string): Promise<ExerciseItem | null> {
  await connectToDatabase();
  if (!/^[a-f\d]{24}$/i.test(id)) return null;

  const doc = await Exercise.findOne({
    _id: id,
    archivedAt: null,
  }).lean<ExerciseDoc>();
  if (!doc) return null;

  return {
    id: String(doc._id),
    name: doc.name,
    category: (doc.category ?? "") as ExerciseCategory | "",
    instructions: doc.instructions ?? "",
    externalVideoUrl: doc.externalVideoUrl ?? "",
    active: doc.active,
  };
}

/** Active exercises only — what the workout builder offers. */
export async function listActiveExercises(): Promise<ExerciseItem[]> {
  await connectToDatabase();

  const docs = await Exercise.find({ archivedAt: null, active: true })
    .sort({ name: 1 })
    .lean<ExerciseDoc[]>();

  return docs.map((doc) => ({
    id: String(doc._id),
    name: doc.name,
    category: (doc.category ?? "") as ExerciseCategory | "",
    instructions: doc.instructions ?? "",
    externalVideoUrl: doc.externalVideoUrl ?? "",
    active: doc.active,
  }));
}

export async function getExerciseCategoryCounts(): Promise<
  Record<string, number>
> {
  await connectToDatabase();

  const rows = await Exercise.aggregate<{ _id: string; count: number }>([
    { $match: { archivedAt: null } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of rows) {
    if (row._id) counts[row._id] = row.count;
    total += row.count;
  }
  counts.all = total;
  return counts;
}

// ---------------------------------------------------------------------------
// Workout templates
// ---------------------------------------------------------------------------

export async function listWorkoutTemplates(): Promise<WorkoutTemplateItem[]> {
  await connectToDatabase();

  const docs = await WorkoutTemplate.find({ archivedAt: null })
    .sort({ active: -1, name: 1 })
    .lean<WorkoutTemplateDoc[]>();

  return docs.map((doc) => {
    const days = toDays(doc.days as unknown as RawDay[]);
    return {
      id: String(doc._id),
      name: doc.name,
      description: doc.description ?? "",
      goal: (doc.goal ?? "") as WorkoutGoal | "",
      active: doc.active,
      days,
      dayCount: days.length,
      exerciseCount: countExercises(days),
    };
  });
}

export async function getWorkoutTemplate(
  id: string,
): Promise<WorkoutTemplateItem | null> {
  await connectToDatabase();
  if (!/^[a-f\d]{24}$/i.test(id)) return null;

  const doc = await WorkoutTemplate.findOne({
    _id: id,
    archivedAt: null,
  }).lean<WorkoutTemplateDoc>();
  if (!doc) return null;

  const days = toDays(doc.days as unknown as RawDay[]);
  return {
    id: String(doc._id),
    name: doc.name,
    description: doc.description ?? "",
    goal: (doc.goal ?? "") as WorkoutGoal | "",
    active: doc.active,
    days,
    dayCount: days.length,
    exerciseCount: countExercises(days),
  };
}

// ---------------------------------------------------------------------------
// Client workout plans
// ---------------------------------------------------------------------------

function toPlanItem(doc: ClientWorkoutPlanDoc): ClientWorkoutPlanItem {
  const days = toDays(doc.days as unknown as RawDay[]);
  return {
    id: String(doc._id),
    coachingClientId: String(doc.coachingClient),
    name: doc.name,
    description: doc.description ?? "",
    goal: (doc.goal ?? "") as WorkoutGoal | "",
    active: doc.active,
    days,
    dayCount: days.length,
    exerciseCount: countExercises(days),
    sourceTemplateId: doc.sourceTemplate ? String(doc.sourceTemplate) : null,
    sourceTemplateName: doc.sourceTemplateName ?? "",
    customised: doc.customised,
    startDate: doc.startDate.toISOString(),
  };
}

export async function listClientWorkoutPlans(
  coachingClientId: string,
): Promise<ClientWorkoutPlanItem[]> {
  await connectToDatabase();

  const docs = await ClientWorkoutPlan.find({
    coachingClient: coachingClientId,
    archivedAt: null,
  })
    .sort({ active: -1, startDate: -1 })
    .lean<ClientWorkoutPlanDoc[]>();

  return docs.map(toPlanItem);
}

export async function getClientWorkoutPlan(
  id: string,
): Promise<ClientWorkoutPlanItem | null> {
  await connectToDatabase();
  if (!/^[a-f\d]{24}$/i.test(id)) return null;

  const doc = await ClientWorkoutPlan.findOne({
    _id: id,
    archivedAt: null,
  }).lean<ClientWorkoutPlanDoc>();
  if (!doc) return null;

  return toPlanItem(doc);
}
