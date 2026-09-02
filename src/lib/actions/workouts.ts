"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Model } from "mongoose";
import { requireUserOrThrow, UnauthorizedError } from "@/lib/auth/guard";
import { connectToDatabase } from "@/lib/db";
import { Exercise } from "@/models/Exercise";
import { WorkoutTemplate } from "@/models/WorkoutTemplate";
import { ClientWorkoutPlan } from "@/models/ClientWorkoutPlan";
import { CoachingClient } from "@/models/CoachingClient";
import { getBrandSettings } from "@/lib/settings";
import type { WorkoutGoal } from "@/lib/workouts/constants";
import { zonedDayStart } from "@/lib/dates";
import {
  assignWorkoutSchema,
  exerciseSchema,
  workoutDaySchema,
  workoutDetailsSchema,
  workoutExerciseSchema,
} from "@/lib/validation/workout";
import {
  errorState,
  fieldErrorsFromZod,
  formValues,
  successState,
  type FormState,
} from "@/lib/actions/types";

/** Shape of a template read with `.lean()`, for the assign deep-copy. */
type TemplateSnapshot = {
  _id: unknown;
  name: string;
  description?: string;
  goal?: string;
  days?: {
    name: string;
    notes?: string;
    order?: number;
    exercises?: {
      exercise?: unknown;
      exerciseName: string;
      videoUrl?: string;
      sets?: string;
      reps?: string;
      rest?: string;
      notes?: string;
      order?: number;
    }[];
  }[];
};

type CopiedDay = {
  name: string;
  notes: string;
  order: number;
  exercises: {
    exercise: unknown;
    exerciseName: string;
    videoUrl: string;
    sets: string;
    reps: string;
    rest: string;
    notes: string;
    order: number;
  }[];
};

const EXERCISE_FIELDS = [
  "name",
  "category",
  "instructions",
  "externalVideoUrl",
] as const;

const WORKOUT_FIELDS = ["name", "description", "goal"] as const;

async function requireStaff() {
  try {
    return await requireUserOrThrow();
  } catch (error) {
    if (error instanceof UnauthorizedError) return null;
    throw error;
  }
}

function isRedirectError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT"),
  );
}

// ---------------------------------------------------------------------------
// Exercise library
// ---------------------------------------------------------------------------

export async function saveExerciseAction(
  exerciseId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = exerciseSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category") ?? "",
    instructions: formData.get("instructions") ?? "",
    externalVideoUrl: formData.get("externalVideoUrl") ?? "",
    active: formData.get("active") ?? undefined,
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
      formValues(formData, EXERCISE_FIELDS),
    );
  }

  const data = {
    name: parsed.data.name,
    category: parsed.data.category,
    instructions: parsed.data.instructions,
    externalVideoUrl: parsed.data.externalVideoUrl,
    active: parsed.data.active !== "no",
  };

  try {
    await connectToDatabase();
    if (exerciseId) {
      const result = await Exercise.updateOne(
        { _id: exerciseId, archivedAt: null },
        { $set: data },
      );
      if (result.matchedCount === 0) {
        return errorState("This exercise no longer exists.");
      }
    } else {
      await Exercise.create(data);
    }
  } catch {
    return errorState(
      "Could not save this exercise. Please try again.",
      undefined,
      formValues(formData, EXERCISE_FIELDS),
    );
  }

  revalidatePath("/exercises");
  redirect("/exercises");
}

/**
 * Deactivates or reactivates an exercise.
 *
 * Never deleted: workouts snapshot the name at the time they were built, but
 * the reference is kept so the library entry stays reachable.
 */
export async function toggleExerciseAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const exerciseId = String(formData.get("exerciseId") ?? "");
  const active = formData.get("active") === "yes";
  if (!exerciseId) return errorState("This exercise no longer exists.");

  try {
    await connectToDatabase();
    await Exercise.updateOne(
      { _id: exerciseId, archivedAt: null },
      { $set: { active } },
    );
  } catch {
    return errorState("Could not update this exercise. Please try again.");
  }

  revalidatePath("/exercises");
  return successState(active ? "Exercise reactivated." : "Exercise deactivated.");
}

// ---------------------------------------------------------------------------
// Shared day/exercise editing
//
// Templates and client plans hold the same `days` structure, so one set of
// operations serves both. `kind` selects the collection; everything else is
// identical.
// ---------------------------------------------------------------------------

type WorkoutKind = "template" | "plan";

function ownerModel(kind: WorkoutKind) {
  return (
    kind === "template" ? WorkoutTemplate : ClientWorkoutPlan
  ) as unknown as Model<Record<string, unknown>>;
}

function ownerPath(kind: WorkoutKind, ownerId: string, clientId?: string) {
  return kind === "template"
    ? `/workouts/${ownerId}`
    : `/coaching/${clientId}/workouts/${ownerId}`;
}

/** Loads the document and marks a template-derived plan as customised. */
async function loadOwner(kind: WorkoutKind, ownerId: string) {
  const Model = ownerModel(kind);
  const doc = await Model.findOne({ _id: ownerId, archivedAt: null });
  if (!doc) return null;
  if (kind === "plan" && doc.get("sourceTemplate")) {
    doc.set("customised", true);
  }
  return doc;
}

export async function addWorkoutDayAction(
  kind: WorkoutKind,
  ownerId: string,
  clientId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = workoutDaySchema.safeParse({
    name: formData.get("name"),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return errorState(
      "Give the day a name.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  try {
    await connectToDatabase();
    const doc = await loadOwner(kind, ownerId);
    if (!doc) return errorState("This workout no longer exists.");

    const days = doc.get("days") as { order: number }[];
    days.push({
      name: parsed.data.name,
      notes: parsed.data.notes,
      exercises: [],
      order: days.length,
    } as never);

    await doc.save();
  } catch {
    return errorState("Could not add the day. Please try again.");
  }

  revalidatePath(ownerPath(kind, ownerId, clientId));
  return successState("Day added.");
}

export async function updateWorkoutDayAction(
  kind: WorkoutKind,
  ownerId: string,
  clientId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const dayId = String(formData.get("dayId") ?? "");
  const parsed = workoutDaySchema.safeParse({
    name: formData.get("name"),
    notes: formData.get("notes") ?? "",
  });

  if (!dayId) return errorState("That day no longer exists.");
  if (!parsed.success) {
    return errorState("Give the day a name.", fieldErrorsFromZod(parsed.error));
  }

  try {
    await connectToDatabase();
    const doc = await loadOwner(kind, ownerId);
    if (!doc) return errorState("This workout no longer exists.");

    const days = doc.get("days") as { _id: { toString(): string } }[];
    const day = days.find((entry) => String(entry._id) === dayId) as
      | (Record<string, unknown> & { set?: (k: string, v: unknown) => void })
      | undefined;
    if (!day) return errorState("That day no longer exists.");

    day.set?.("name", parsed.data.name);
    day.set?.("notes", parsed.data.notes);

    await doc.save();
  } catch {
    return errorState("Could not save the day. Please try again.");
  }

  revalidatePath(ownerPath(kind, ownerId, clientId));
  return successState("Day updated.");
}

export async function removeWorkoutDayAction(
  kind: WorkoutKind,
  ownerId: string,
  clientId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const dayId = String(formData.get("dayId") ?? "");
  if (!dayId) return errorState("That day no longer exists.");

  try {
    await connectToDatabase();
    const doc = await loadOwner(kind, ownerId);
    if (!doc) return errorState("This workout no longer exists.");

    const days = doc.get("days") as {
      _id: { toString(): string };
      order: number;
    }[];
    const remaining = days.filter((day) => String(day._id) !== dayId);
    remaining.forEach((day, index) => {
      (day as unknown as { set: (k: string, v: unknown) => void }).set(
        "order",
        index,
      );
    });
    doc.set("days", remaining);

    await doc.save();
  } catch {
    return errorState("Could not remove the day. Please try again.");
  }

  revalidatePath(ownerPath(kind, ownerId, clientId));
  return successState("Day removed.");
}

export async function addWorkoutExerciseAction(
  kind: WorkoutKind,
  ownerId: string,
  clientId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const dayId = String(formData.get("dayId") ?? "");
  const parsed = workoutExerciseSchema.safeParse({
    exerciseId: formData.get("exerciseId") ?? "",
    exerciseName: formData.get("exerciseName") ?? "",
    sets: formData.get("sets") ?? "",
    reps: formData.get("reps") ?? "",
    rest: formData.get("rest") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!dayId) return errorState("That day no longer exists.");
  if (!parsed.success) {
    return errorState(
      "Please check the exercise details.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  try {
    await connectToDatabase();

    // Snapshot the library entry so a later rename cannot rewrite history.
    let exerciseName = parsed.data.exerciseName;
    let videoUrl = "";
    let exerciseRef: string | null = null;

    if (parsed.data.exerciseId) {
      const library = await Exercise.findById(parsed.data.exerciseId)
        .select("name externalVideoUrl")
        .lean();
      if (library) {
        exerciseName = library.name;
        videoUrl = library.externalVideoUrl ?? "";
        exerciseRef = parsed.data.exerciseId;
      }
    }

    if (!exerciseName) {
      return errorState("Please fix the highlighted fields.", {
        exerciseName: "Pick an exercise or type a name",
      });
    }

    const doc = await loadOwner(kind, ownerId);
    if (!doc) return errorState("This workout no longer exists.");

    const days = doc.get("days") as {
      _id: { toString(): string };
      exercises: { length: number; push: (value: unknown) => void };
    }[];
    const day = days.find((entry) => String(entry._id) === dayId);
    if (!day) return errorState("That day no longer exists.");

    day.exercises.push({
      exercise: exerciseRef,
      exerciseName,
      videoUrl,
      sets: parsed.data.sets,
      reps: parsed.data.reps,
      rest: parsed.data.rest,
      notes: parsed.data.notes,
      order: day.exercises.length,
    });

    await doc.save();
  } catch {
    return errorState("Could not add the exercise. Please try again.");
  }

  revalidatePath(ownerPath(kind, ownerId, clientId));
  return successState("Exercise added.");
}

export async function updateWorkoutExerciseAction(
  kind: WorkoutKind,
  ownerId: string,
  clientId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const dayId = String(formData.get("dayId") ?? "");
  const entryId = String(formData.get("entryId") ?? "");
  const parsed = workoutExerciseSchema.safeParse({
    exerciseId: "",
    exerciseName: formData.get("exerciseName") ?? "",
    sets: formData.get("sets") ?? "",
    reps: formData.get("reps") ?? "",
    rest: formData.get("rest") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!dayId || !entryId) return errorState("That exercise no longer exists.");
  if (!parsed.success) {
    return errorState(
      "Please check the exercise details.",
      fieldErrorsFromZod(parsed.error),
    );
  }
  if (!parsed.data.exerciseName) {
    return errorState("Please fix the highlighted fields.", {
      exerciseName: "Name is required",
    });
  }

  try {
    await connectToDatabase();
    const doc = await loadOwner(kind, ownerId);
    if (!doc) return errorState("This workout no longer exists.");

    const days = doc.get("days") as {
      _id: { toString(): string };
      exercises: (Record<string, unknown> & {
        _id: { toString(): string };
        set: (k: string, v: unknown) => void;
      })[];
    }[];
    const day = days.find((entry) => String(entry._id) === dayId);
    if (!day) return errorState("That day no longer exists.");

    const entry = day.exercises.find((item) => String(item._id) === entryId);
    if (!entry) return errorState("That exercise no longer exists.");

    entry.set("exerciseName", parsed.data.exerciseName);
    entry.set("sets", parsed.data.sets);
    entry.set("reps", parsed.data.reps);
    entry.set("rest", parsed.data.rest);
    entry.set("notes", parsed.data.notes);

    await doc.save();
  } catch {
    return errorState("Could not save the exercise. Please try again.");
  }

  revalidatePath(ownerPath(kind, ownerId, clientId));
  return successState("Exercise updated.");
}

export async function removeWorkoutExerciseAction(
  kind: WorkoutKind,
  ownerId: string,
  clientId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const dayId = String(formData.get("dayId") ?? "");
  const entryId = String(formData.get("entryId") ?? "");
  if (!dayId || !entryId) return errorState("That exercise no longer exists.");

  try {
    await connectToDatabase();
    const doc = await loadOwner(kind, ownerId);
    if (!doc) return errorState("This workout no longer exists.");

    const days = doc.get("days") as {
      _id: { toString(): string };
      exercises: { _id: { toString(): string } }[];
      set: (k: string, v: unknown) => void;
    }[];
    const day = days.find((entry) => String(entry._id) === dayId);
    if (!day) return errorState("That day no longer exists.");

    const remaining = day.exercises.filter(
      (item) => String(item._id) !== entryId,
    );
    remaining.forEach((item, index) => {
      (item as unknown as { set: (k: string, v: unknown) => void }).set(
        "order",
        index,
      );
    });
    day.set("exercises", remaining);

    await doc.save();
  } catch {
    return errorState("Could not remove the exercise. Please try again.");
  }

  revalidatePath(ownerPath(kind, ownerId, clientId));
  return successState("Exercise removed.");
}

// ---------------------------------------------------------------------------
// Workout templates
// ---------------------------------------------------------------------------

export async function saveWorkoutTemplateAction(
  templateId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = workoutDetailsSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    goal: formData.get("goal") ?? "",
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
      formValues(formData, WORKOUT_FIELDS),
    );
  }

  let id = templateId;

  try {
    await connectToDatabase();
    if (templateId) {
      const result = await WorkoutTemplate.updateOne(
        { _id: templateId, archivedAt: null },
        { $set: parsed.data },
      );
      if (result.matchedCount === 0) {
        return errorState("This template no longer exists.");
      }
    } else {
      const created = await WorkoutTemplate.create(parsed.data);
      id = String(created._id);
    }
  } catch {
    return errorState(
      "Could not save this template. Please try again.",
      undefined,
      formValues(formData, WORKOUT_FIELDS),
    );
  }

  revalidatePath("/workouts");
  revalidatePath(`/workouts/${id}`);
  redirect(`/workouts/${id}`);
}

export async function toggleWorkoutTemplateAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const templateId = String(formData.get("templateId") ?? "");
  const active = formData.get("active") === "yes";
  if (!templateId) return errorState("This template no longer exists.");

  try {
    await connectToDatabase();
    await WorkoutTemplate.updateOne(
      { _id: templateId, archivedAt: null },
      { $set: { active } },
    );
  } catch {
    return errorState("Could not update this template. Please try again.");
  }

  revalidatePath("/workouts");
  return successState(active ? "Template reactivated." : "Template deactivated.");
}

// ---------------------------------------------------------------------------
// Client workout plans
// ---------------------------------------------------------------------------

/**
 * Creates a plan for a coaching client, optionally from a template.
 *
 * The template's days are DEEP-COPIED, never referenced. Customising the
 * client's plan afterwards cannot affect the template or any other client.
 */
export async function assignWorkoutAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = assignWorkoutSchema.safeParse({
    coachingClientId: formData.get("coachingClientId"),
    templateId: formData.get("templateId") ?? "",
    name: formData.get("name"),
    startDate: formData.get("startDate"),
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  let planId: string;
  const clientId = parsed.data.coachingClientId;

  try {
    await connectToDatabase();

    const client = await CoachingClient.findOne({
      _id: clientId,
      archivedAt: null,
    }).select("_id");
    if (!client) return errorState("That coaching client no longer exists.");

    const brand = await getBrandSettings();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(parsed.data.startDate);
    if (!match) return errorState("Please check the start date.");
    const startDate = zonedDayStart(
      Number(match[1]),
      Number(match[2]),
      Number(match[3]),
      brand.timezone,
    );

    let days: CopiedDay[] = [];
    let description = "";
    let goal: WorkoutGoal | "" = "";
    let sourceTemplate: string | null = null;
    let sourceTemplateName = "";

    if (parsed.data.templateId) {
      const template = (await WorkoutTemplate.findById(parsed.data.templateId)
        .lean()
        .exec()) as unknown as TemplateSnapshot | null;
      if (!template) return errorState("That template no longer exists.");

      // Every subdocument is rebuilt field by field, dropping the template's
      // own `_id`s. The plan gets fresh ones, so the copy is genuinely
      // independent and editing it can never reach back into the template.
      days = (template.days ?? []).map((day) => ({
        name: day.name,
        notes: day.notes ?? "",
        order: day.order ?? 0,
        exercises: (day.exercises ?? []).map((entry) => ({
          exercise: entry.exercise ?? null,
          exerciseName: entry.exerciseName,
          videoUrl: entry.videoUrl ?? "",
          sets: entry.sets ?? "",
          reps: entry.reps ?? "",
          rest: entry.rest ?? "",
          notes: entry.notes ?? "",
          order: entry.order ?? 0,
        })),
      }));
      description = template.description ?? "";
      goal = (template.goal ?? "") as WorkoutGoal | "";
      sourceTemplate = String(template._id);
      sourceTemplateName = template.name;
    }

    const created = await ClientWorkoutPlan.create({
      coachingClient: client._id,
      name: parsed.data.name,
      description,
      goal,
      days,
      sourceTemplate,
      sourceTemplateName,
      customised: false,
      startDate,
      active: true,
    });

    planId = String(created._id);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return errorState("Could not create this plan. Please try again.");
  }

  revalidatePath(`/coaching/${clientId}`);
  redirect(`/coaching/${clientId}/workouts/${planId}`);
}

export async function updateClientPlanDetailsAction(
  planId: string,
  clientId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = workoutDetailsSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    goal: formData.get("goal") ?? "",
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
      formValues(formData, WORKOUT_FIELDS),
    );
  }

  try {
    await connectToDatabase();
    const doc = await ClientWorkoutPlan.findOne({
      _id: planId,
      archivedAt: null,
    });
    if (!doc) return errorState("This plan no longer exists.");

    doc.set(parsed.data);
    if (doc.get("sourceTemplate")) doc.set("customised", true);
    await doc.save();
  } catch {
    return errorState(
      "Could not save your changes. Please try again.",
      undefined,
      formValues(formData, WORKOUT_FIELDS),
    );
  }

  revalidatePath(`/coaching/${clientId}/workouts/${planId}`);
  revalidatePath(`/coaching/${clientId}`);
  return successState("Plan updated.");
}

export async function toggleClientPlanAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const planId = String(formData.get("planId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const active = formData.get("active") === "yes";
  if (!planId) return errorState("This plan no longer exists.");

  try {
    await connectToDatabase();
    await ClientWorkoutPlan.updateOne(
      { _id: planId, archivedAt: null },
      { $set: { active } },
    );
  } catch {
    return errorState("Could not update this plan. Please try again.");
  }

  revalidatePath(`/coaching/${clientId}/workouts/${planId}`);
  revalidatePath(`/coaching/${clientId}`);
  return successState(active ? "Plan set as active." : "Plan archived.");
}
