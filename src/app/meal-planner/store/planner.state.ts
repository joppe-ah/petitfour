import { MealPlan } from '../models/meal-plan.model';
import { ShoppingList } from '../models/shopping-list.model';
import { SuggestionRules } from '../models/suggestion-rules.model';

// Helper to get ISO week number
export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Helper to get all 7 dates (Mon-Sun) for a given ISO week
export function getWeekDates(weekNumber: number, year: number): Date[] {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const weekStart = new Date(jan4);
  weekStart.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (weekNumber - 1) * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(weekStart.getUTCDate() + i);
    return d;
  });
}

// Helper: date to YYYY-MM-DD string
export function toDateKey(date: Date): string {
  return new Date(date).toISOString().slice(0, 10);
}

export interface PlannerState {
  mealPlans: MealPlan[];
  shoppingList: ShoppingList | null;
  suggestionRules: SuggestionRules;
  suggestedRecipes: string[];
  selectedWeek: { weekNumber: number; year: number };
  selectedDayDate: string | null;
  loading: boolean;
  error: string | null;
}

const today = new Date();

export const defaultSuggestionRules: SuggestionRules = {
  useSeasonal: true,
  useNotCookedRecently: true,
  notCookedRecentlyDays: 14,
  useFavourites: true,
  maxCookingTime: null,
  excludeCategories: [],
};

export const initialPlannerState: PlannerState = {
  mealPlans: [],
  shoppingList: null,
  suggestionRules: defaultSuggestionRules,
  suggestedRecipes: [],
  selectedWeek: { weekNumber: getISOWeek(today), year: today.getFullYear() },
  selectedDayDate: null,
  loading: false,
  error: null,
};
