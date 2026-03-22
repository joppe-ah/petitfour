import { MealPlan } from '../models/meal-plan.model';

export const MOCK_MEAL_PLANS: MealPlan[] = [
  { id: 'mp1', date: new Date('2026-03-16'), weekNumber: 12, year: 2026, dinnerRecipeId: '2' },
  { id: 'mp2', date: new Date('2026-03-17'), weekNumber: 12, year: 2026, dinnerRecipeId: '5' },
  { id: 'mp3', date: new Date('2026-03-18'), weekNumber: 12, year: 2026, dinnerRecipeId: '6' },
  { id: 'mp4', date: new Date('2026-03-19'), weekNumber: 12, year: 2026, dinnerRecipeId: null },
  { id: 'mp5', date: new Date('2026-03-20'), weekNumber: 12, year: 2026, dinnerRecipeId: '7' },
  { id: 'mp6', date: new Date('2026-03-21'), weekNumber: 12, year: 2026, dinnerRecipeId: null },
  { id: 'mp7', date: new Date('2026-03-22'), weekNumber: 12, year: 2026, dinnerRecipeId: null },
];
