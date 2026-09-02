"use client";

import {
  DietEditor,
  type DietEditorActions,
} from "@/components/diet/diet-editor";
import {
  addDietItemAction,
  addDietMealAction,
  removeDietItemAction,
  removeDietMealAction,
  updateDietItemAction,
  updateDietMealAction,
} from "@/lib/actions/diet";
import type { DietPlanView } from "@/lib/diet/queries";

/** Binds the diet editor actions to one plan. */
export function ClientDietEditor({
  plan,
  clientId,
}: {
  plan: DietPlanView;
  clientId: string;
}) {
  const actions: DietEditorActions = {
    addMeal: addDietMealAction.bind(null, plan.id, clientId),
    updateMeal: updateDietMealAction.bind(null, plan.id, clientId),
    removeMeal: removeDietMealAction.bind(null, plan.id, clientId),
    addItem: addDietItemAction.bind(null, plan.id, clientId),
    updateItem: updateDietItemAction.bind(null, plan.id, clientId),
    removeItem: removeDietItemAction.bind(null, plan.id, clientId),
  };

  return <DietEditor plan={plan} actions={actions} />;
}
