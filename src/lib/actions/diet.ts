"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserOrThrow, UnauthorizedError } from "@/lib/auth/guard";
import { connectToDatabase } from "@/lib/db";
import { DietPlan } from "@/models/DietPlan";
import { CoachingClient } from "@/models/CoachingClient";
import { getBrandSettings } from "@/lib/settings";
import { zonedDayStart } from "@/lib/dates";
import {
  dietItemSchema,
  dietMealSchema,
  dietPlanSchema,
} from "@/lib/validation/diet";
import {
  errorState,
  fieldErrorsFromZod,
  formValues,
  successState,
  type FormState,
} from "@/lib/actions/types";

const PLAN_FIELDS = [
  "title",
  "goal",
  "notes",
  "calorieTarget",
  "proteinTarget",
  "carbTarget",
  "fatTarget",
  "startDate",
] as const;

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

function numberOrNull(value: string): number | null {
  return value === "" ? null : Number(value);
}

/**
 * Creates or updates a diet plan.
 *
 * Targets are stored exactly as the coach entered them. Nothing is calculated
 * from foods, and no nutritional analysis is performed — the app must not
 * imply accuracy it does not have.
 */
export async function saveDietPlanAction(
  planId: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = dietPlanSchema.safeParse({
    coachingClientId: formData.get("coachingClientId"),
    title: formData.get("title"),
    goal: formData.get("goal") ?? "",
    notes: formData.get("notes") ?? "",
    calorieTarget: formData.get("calorieTarget") ?? "",
    proteinTarget: formData.get("proteinTarget") ?? "",
    carbTarget: formData.get("carbTarget") ?? "",
    fatTarget: formData.get("fatTarget") ?? "",
    startDate: formData.get("startDate"),
  });

  if (!parsed.success) {
    return errorState(
      "Please fix the highlighted fields.",
      fieldErrorsFromZod(parsed.error),
      formValues(formData, PLAN_FIELDS),
    );
  }

  const clientId = parsed.data.coachingClientId;
  let id = planId;

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

    const data = {
      title: parsed.data.title,
      goal: parsed.data.goal,
      notes: parsed.data.notes,
      calorieTarget: numberOrNull(parsed.data.calorieTarget),
      proteinTarget: numberOrNull(parsed.data.proteinTarget),
      carbTarget: numberOrNull(parsed.data.carbTarget),
      fatTarget: numberOrNull(parsed.data.fatTarget),
      startDate,
    };

    if (planId) {
      const result = await DietPlan.updateOne(
        { _id: planId, archivedAt: null },
        { $set: data },
      );
      if (result.matchedCount === 0) {
        return errorState("This diet plan no longer exists.");
      }
    } else {
      // A new plan supersedes the previous one, so "the current plan" is never
      // ambiguous. Older plans stay as history, just marked past.
      await DietPlan.updateMany(
        { coachingClient: client._id, archivedAt: null },
        { $set: { active: false } },
      );

      const created = await DietPlan.create({
        ...data,
        coachingClient: client._id,
        meals: [],
        active: true,
      });
      id = String(created._id);
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return errorState(
      "Could not save this plan. Please try again.",
      undefined,
      formValues(formData, PLAN_FIELDS),
    );
  }

  revalidatePath(`/coaching/${clientId}`);
  revalidatePath(`/coaching/${clientId}/diet/${id}`);
  redirect(`/coaching/${clientId}/diet/${id}`);
}

/**
 * Marks a plan active or inactive.
 *
 * Activating one deactivates the client's other plans, so "the current plan"
 * is unambiguous. Nothing is deleted — superseded plans stay as history.
 */
export async function toggleDietPlanAction(
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

    if (active) {
      await DietPlan.updateMany(
        { coachingClient: clientId, archivedAt: null, _id: { $ne: planId } },
        { $set: { active: false } },
      );
    }

    await DietPlan.updateOne(
      { _id: planId, archivedAt: null },
      { $set: { active } },
    );
  } catch {
    return errorState("Could not update this plan. Please try again.");
  }

  revalidatePath(`/coaching/${clientId}/diet/${planId}`);
  revalidatePath(`/coaching/${clientId}`);
  return successState(
    active ? "Set as the current plan." : "Plan marked as past.",
  );
}

// ---------------------------------------------------------------------------
// Meals and items
// ---------------------------------------------------------------------------

async function loadPlan(planId: string) {
  return DietPlan.findOne({ _id: planId, archivedAt: null });
}

export async function addDietMealAction(
  planId: string,
  clientId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const parsed = dietMealSchema.safeParse({
    name: formData.get("name"),
    time: formData.get("time") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return errorState("Give the meal a name.", fieldErrorsFromZod(parsed.error));
  }

  try {
    await connectToDatabase();
    const doc = await loadPlan(planId);
    if (!doc) return errorState("This plan no longer exists.");

    const meals = doc.get("meals") as { length: number; push: (v: unknown) => void };
    meals.push({
      name: parsed.data.name,
      time: parsed.data.time,
      notes: parsed.data.notes,
      items: [],
      order: meals.length,
    });

    await doc.save();
  } catch {
    return errorState("Could not add the meal. Please try again.");
  }

  revalidatePath(`/coaching/${clientId}/diet/${planId}`);
  return successState("Meal added.");
}

export async function updateDietMealAction(
  planId: string,
  clientId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const mealId = String(formData.get("mealId") ?? "");
  const parsed = dietMealSchema.safeParse({
    name: formData.get("name"),
    time: formData.get("time") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!mealId) return errorState("That meal no longer exists.");
  if (!parsed.success) {
    return errorState("Give the meal a name.", fieldErrorsFromZod(parsed.error));
  }

  try {
    await connectToDatabase();
    const doc = await loadPlan(planId);
    if (!doc) return errorState("This plan no longer exists.");

    const meals = doc.get("meals") as {
      _id: { toString(): string };
      set: (k: string, v: unknown) => void;
    }[];
    const meal = meals.find((entry) => String(entry._id) === mealId);
    if (!meal) return errorState("That meal no longer exists.");

    meal.set("name", parsed.data.name);
    meal.set("time", parsed.data.time);
    meal.set("notes", parsed.data.notes);

    await doc.save();
  } catch {
    return errorState("Could not save the meal. Please try again.");
  }

  revalidatePath(`/coaching/${clientId}/diet/${planId}`);
  return successState("Meal updated.");
}

export async function removeDietMealAction(
  planId: string,
  clientId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const mealId = String(formData.get("mealId") ?? "");
  if (!mealId) return errorState("That meal no longer exists.");

  try {
    await connectToDatabase();
    const doc = await loadPlan(planId);
    if (!doc) return errorState("This plan no longer exists.");

    const meals = doc.get("meals") as { _id: { toString(): string } }[];
    const remaining = meals.filter((meal) => String(meal._id) !== mealId);
    remaining.forEach((meal, index) => {
      (meal as unknown as { set: (k: string, v: unknown) => void }).set(
        "order",
        index,
      );
    });
    doc.set("meals", remaining);

    await doc.save();
  } catch {
    return errorState("Could not remove the meal. Please try again.");
  }

  revalidatePath(`/coaching/${clientId}/diet/${planId}`);
  return successState("Meal removed.");
}

export async function addDietItemAction(
  planId: string,
  clientId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const mealId = String(formData.get("mealId") ?? "");
  const parsed = dietItemSchema.safeParse({
    food: formData.get("food"),
    quantity: formData.get("quantity") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!mealId) return errorState("That meal no longer exists.");
  if (!parsed.success) {
    return errorState(
      "Please check the food details.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  try {
    await connectToDatabase();
    const doc = await loadPlan(planId);
    if (!doc) return errorState("This plan no longer exists.");

    const meals = doc.get("meals") as {
      _id: { toString(): string };
      items: { length: number; push: (v: unknown) => void };
    }[];
    const meal = meals.find((entry) => String(entry._id) === mealId);
    if (!meal) return errorState("That meal no longer exists.");

    meal.items.push({
      food: parsed.data.food,
      quantity: parsed.data.quantity,
      notes: parsed.data.notes,
      order: meal.items.length,
    });

    await doc.save();
  } catch {
    return errorState("Could not add the food. Please try again.");
  }

  revalidatePath(`/coaching/${clientId}/diet/${planId}`);
  return successState("Food added.");
}

export async function updateDietItemAction(
  planId: string,
  clientId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const mealId = String(formData.get("mealId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const parsed = dietItemSchema.safeParse({
    food: formData.get("food"),
    quantity: formData.get("quantity") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!mealId || !itemId) return errorState("That food no longer exists.");
  if (!parsed.success) {
    return errorState(
      "Please check the food details.",
      fieldErrorsFromZod(parsed.error),
    );
  }

  try {
    await connectToDatabase();
    const doc = await loadPlan(planId);
    if (!doc) return errorState("This plan no longer exists.");

    const meals = doc.get("meals") as {
      _id: { toString(): string };
      items: {
        _id: { toString(): string };
        set: (k: string, v: unknown) => void;
      }[];
    }[];
    const meal = meals.find((entry) => String(entry._id) === mealId);
    if (!meal) return errorState("That meal no longer exists.");

    const item = meal.items.find((entry) => String(entry._id) === itemId);
    if (!item) return errorState("That food no longer exists.");

    item.set("food", parsed.data.food);
    item.set("quantity", parsed.data.quantity);
    item.set("notes", parsed.data.notes);

    await doc.save();
  } catch {
    return errorState("Could not save the food. Please try again.");
  }

  revalidatePath(`/coaching/${clientId}/diet/${planId}`);
  return successState("Food updated.");
}

export async function removeDietItemAction(
  planId: string,
  clientId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireStaff();
  if (!user) return errorState("Your session expired. Please sign in again.");

  const mealId = String(formData.get("mealId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  if (!mealId || !itemId) return errorState("That food no longer exists.");

  try {
    await connectToDatabase();
    const doc = await loadPlan(planId);
    if (!doc) return errorState("This plan no longer exists.");

    const meals = doc.get("meals") as {
      _id: { toString(): string };
      items: { _id: { toString(): string } }[];
      set: (k: string, v: unknown) => void;
    }[];
    const meal = meals.find((entry) => String(entry._id) === mealId);
    if (!meal) return errorState("That meal no longer exists.");

    const remaining = meal.items.filter((item) => String(item._id) !== itemId);
    remaining.forEach((item, index) => {
      (item as unknown as { set: (k: string, v: unknown) => void }).set(
        "order",
        index,
      );
    });
    meal.set("items", remaining);

    await doc.save();
  } catch {
    return errorState("Could not remove the food. Please try again.");
  }

  revalidatePath(`/coaching/${clientId}/diet/${planId}`);
  return successState("Food removed.");
}
