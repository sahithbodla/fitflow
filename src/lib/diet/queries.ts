import "server-only";
import { connectToDatabase } from "@/lib/db";
import { DietPlan, type DietPlanDoc } from "@/models/DietPlan";
import type { DietGoal } from "@/lib/diet/constants";

export type DietItemView = {
  id: string;
  food: string;
  quantity: string;
  notes: string;
};

export type DietMealView = {
  id: string;
  name: string;
  time: string;
  notes: string;
  items: DietItemView[];
};

export type DietPlanView = {
  id: string;
  coachingClientId: string;
  title: string;
  goal: DietGoal | "";
  notes: string;
  calorieTarget: number | null;
  proteinTarget: number | null;
  carbTarget: number | null;
  fatTarget: number | null;
  meals: DietMealView[];
  mealCount: number;
  itemCount: number;
  startDate: string;
  active: boolean;
};

type RawMeal = {
  _id: unknown;
  name: string;
  time?: string;
  notes?: string;
  order: number;
  items: {
    _id: unknown;
    food: string;
    quantity?: string;
    notes?: string;
    order: number;
  }[];
};

function toView(doc: DietPlanDoc): DietPlanView {
  const meals = [...((doc.meals ?? []) as unknown as RawMeal[])]
    .sort((a, b) => a.order - b.order)
    .map((meal) => ({
      id: String(meal._id),
      name: meal.name,
      time: meal.time ?? "",
      notes: meal.notes ?? "",
      items: [...(meal.items ?? [])]
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          id: String(item._id),
          food: item.food,
          quantity: item.quantity ?? "",
          notes: item.notes ?? "",
        })),
    }));

  return {
    id: String(doc._id),
    coachingClientId: String(doc.coachingClient),
    title: doc.title,
    goal: (doc.goal ?? "") as DietGoal | "",
    notes: doc.notes ?? "",
    calorieTarget: doc.calorieTarget ?? null,
    proteinTarget: doc.proteinTarget ?? null,
    carbTarget: doc.carbTarget ?? null,
    fatTarget: doc.fatTarget ?? null,
    meals,
    mealCount: meals.length,
    itemCount: meals.reduce((sum, meal) => sum + meal.items.length, 0),
    startDate: doc.startDate.toISOString(),
    active: doc.active,
  };
}

export async function listDietPlans(
  coachingClientId: string,
): Promise<DietPlanView[]> {
  await connectToDatabase();

  const docs = await DietPlan.find({
    coachingClient: coachingClientId,
    archivedAt: null,
  })
    .sort({ active: -1, startDate: -1 })
    .lean<DietPlanDoc[]>();

  return docs.map(toView);
}

export async function getDietPlan(id: string): Promise<DietPlanView | null> {
  await connectToDatabase();
  if (!/^[a-f\d]{24}$/i.test(id)) return null;

  const doc = await DietPlan.findOne({
    _id: id,
    archivedAt: null,
  }).lean<DietPlanDoc>();
  if (!doc) return null;

  return toView(doc);
}
