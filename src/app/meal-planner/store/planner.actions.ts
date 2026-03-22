import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { MealPlan } from '../models/meal-plan.model';
import { ShoppingList, ShoppingItem } from '../models/shopping-list.model';
import { SuggestionRules } from '../models/suggestion-rules.model';

export const PlannerActions = createActionGroup({
  source: 'Planner',
  events: {
    'Load Meal Plans': emptyProps(),
    'Load Meal Plans Success': props<{ mealPlans: MealPlan[] }>(),
    'Set Selected Week': props<{ weekNumber: number; year: number }>(),
    'Set Selected Day': props<{ dateKey: string | null }>(),
    'Assign Recipe To Day': props<{ dateKey: string; recipeId: string; weekNumber: number; year: number }>(),
    'Remove Recipe From Day': props<{ dateKey: string }>(),
    'Generate Shopping List': emptyProps(),
    'Generate Shopping List Success': props<{ shoppingList: ShoppingList }>(),
    'Toggle Shopping Item': props<{ itemId: string }>(),
    'Add Manual Shopping Item': props<{ item: Omit<ShoppingItem, 'id' | 'isManual' | 'recipeIds'> }>(),
    'Remove Shopping Item': props<{ itemId: string }>(),
    'Clear Checked Items': emptyProps(),
    'Update Suggestion Rules': props<{ rules: SuggestionRules }>(),
    'Load Suggestions': emptyProps(),
    'Load Suggestions Success': props<{ recipeIds: string[] }>(),
  },
});
