import { createSelector } from '@ngrx/store';
import { toDateKey } from './planner.state';
import { ShoppingItem } from '../models/shopping-list.model';
import {
  selectMealPlans,
  selectShoppingList,
  selectSuggestionRules,
  selectSuggestedRecipes,
  selectSelectedWeek,
  selectSelectedDayDate,
  selectLoading,
  selectError,
} from './planner.reducer';

// Re-export feature selectors
export {
  selectMealPlans,
  selectShoppingList,
  selectSuggestionRules,
  selectSuggestedRecipes,
  selectSelectedWeek,
  selectSelectedDayDate,
  selectLoading,
  selectError,
};

// Alias selectedDayDate as selectedDay for convenience
export const selectSelectedDay = selectSelectedDayDate;

export const selectCurrentWeekPlans = createSelector(
  selectMealPlans,
  selectSelectedWeek,
  (plans, week) => plans.filter(p => p.weekNumber === week.weekNumber && p.year === week.year)
);

export const selectWeekProgress = createSelector(
  selectCurrentWeekPlans,
  (plans) => plans.filter(p => p.dinnerRecipeId !== null).length
);

export const selectSelectedDayPlan = createSelector(
  selectMealPlans,
  selectSelectedDayDate,
  (plans, dateKey) => dateKey ? (plans.find(p => toDateKey(p.date) === dateKey) ?? null) : null
);

export const selectTodaysMeal = createSelector(
  selectMealPlans,
  (plans) => {
    const todayKey = toDateKey(new Date());
    return plans.find(p => toDateKey(p.date) === todayKey) ?? null;
  }
);

export const selectShoppingListByCategory = createSelector(
  selectShoppingList,
  (list) => {
    if (!list) return {} as Record<string, ShoppingItem[]>;
    const grouped: Record<string, ShoppingItem[]> = {};
    for (const item of list.items) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }
    return grouped;
  }
);
